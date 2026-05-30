import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ImportCollectionRequest } from '@collection-hub/libs';

import { JsonStoreRepository } from '../storage/json-store.repository';
import { ImportService } from './import.service';

const importRequest: ImportCollectionRequest = {
  source: 'xhs',
  status: 'pending_download',
  capturedAt: '2026-05-12T15:30:00.000Z',
  collection: {
    id: 'collection-1',
    sourceUrl: 'https://example.test/collections/1',
    title: 'Saved notes',
    coverUrl: 'https://example.test/cover.jpg',
  },
  items: [
    {
      id: 'note-1',
      title: 'First note',
      noteUrl: 'https://example.test/notes/1',
      coverUrl: 'https://example.test/notes/1.jpg',
      mediaType: 'video',
      author: {
        id: 'author-1',
        name: 'Alice',
        avatarUrl: 'https://example.test/alice.jpg',
        profileUrl: 'https://example.test/users/alice',
      },
    },
    {
      id: 'note-2',
      title: 'Second note',
      noteUrl: 'https://example.test/notes/2',
      author: {
        id: 'author-2',
        name: 'Bob',
      },
    },
  ],
};

describe('ImportService', () => {
  let tempDir: string;
  let repository: JsonStoreRepository;
  let service: ImportService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'xhs-import-'));
    repository = new JsonStoreRepository(join(tempDir, 'store.json'));
    service = new ImportService(repository);
  });

  afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true });
  });

  it('creates collection, item, and author records for a new import', async () => {
    const summary = await service.importCollection(importRequest);
    const store = await repository.read();

    expect(summary).toMatchObject({
      collectionId: 'xhs:pending_download',
      createdItems: 2,
      updatedItems: 0,
      authors: 2,
    });
    expect(Object.keys(store.collections).sort()).toEqual([
      'xhs:downloaded',
      'xhs:not_downloaded',
      'xhs:pending_download',
    ]);
    expect(store.collections['xhs:pending_download']).toMatchObject({
      id: 'xhs:pending_download',
      source: 'xhs',
      status: 'pending_download',
      title: 'xhs / 待下载',
      sourceUrl: 'https://example.test/collections/1',
    });
    expect(store.collections['xhs:pending_download']?.itemIds).toEqual([
      'note-1',
      'note-2',
    ]);
    expect(store.collections['xhs:pending_download']?.raw).toMatchObject({
      sourceCollection: {
        id: 'collection-1',
        title: 'Saved notes',
      },
    });
    expect(store.items['note-1']?.source).toBe('xhs');
    expect(store.items['note-1']?.collectionId).toBe('xhs:pending_download');
    expect(store.items['note-1']?.status).toBe('pending_download');
    expect(store.items['note-1']?.mediaType).toBe('video');
    expect(store.authors['author-1']?.source).toBe('xhs');
    expect(store.authors['author-1']?.name).toBe('Alice');
    expect(store.authors['author-1']?.profileUrl).toBe(
      'https://example.test/users/alice',
    );
  });

  it('updates existing items and moves them between fixed destination collections on re-import', async () => {
    await service.importCollection(importRequest);

    const summary = await service.importCollection({
      ...importRequest,
      status: 'downloaded',
      items: [
        {
          ...importRequest.items[1],
          title: 'Second note updated',
        },
        importRequest.items[0],
      ],
    });
    const store = await repository.read();

    expect(summary.createdItems).toBe(0);
    expect(summary.updatedItems).toBe(2);
    expect(store.collections['xhs:pending_download']?.itemIds).toEqual([]);
    expect(store.collections['xhs:downloaded']?.itemIds).toEqual([
      'note-2',
      'note-1',
    ]);
    expect(store.collections['xhs:not_downloaded']?.itemIds).toEqual([]);
    expect(store.items['note-1']?.collectionId).toBe('xhs:downloaded');
    expect(store.items['note-2']?.title).toBe('Second note updated');
    expect(store.items['note-2']?.status).toBe('downloaded');
  });

  it('preserves an existing item rating on re-import', async () => {
    await service.importCollection(importRequest);
    await repository.update((store) => {
      const item = store.items['note-1'];
      if (!item) {
        throw new Error('expected note-1 to exist');
      }
      item.rating = 'A';
    });

    await service.importCollection({
      ...importRequest,
      items: [
        {
          ...importRequest.items[0],
          title: 'First note updated',
        },
      ],
    });
    const store = await repository.read();

    expect(store.items['note-1']).toMatchObject({
      rating: 'A',
      title: 'First note updated',
    });
  });

  it('derives stable fallback item and author IDs when source IDs are missing', async () => {
    const requestWithoutIds: ImportCollectionRequest = {
      ...importRequest,
      items: [
        {
          title: 'No source ID',
          noteUrl: 'https://example.test/notes/no-id',
          author: {
            name: 'Fallback Author',
            profileUrl: 'https://example.test/users/fallback',
          },
        },
      ],
    };

    await service.importCollection(requestWithoutIds);
    const firstStore = await repository.read();
    const itemId = Object.keys(firstStore.items)[0];
    const authorId = Object.keys(firstStore.authors)[0];
    const secondSummary = await service.importCollection(requestWithoutIds);
    const secondStore = await repository.read();

    expect(itemId).toMatch(/^item_/);
    expect(authorId).toMatch(/^author_/);
    expect(Object.keys(secondStore.items)).toEqual([itemId]);
    expect(Object.keys(secondStore.authors)).toEqual([authorId]);
    expect(secondSummary.updatedItems).toBe(1);
  });
});
