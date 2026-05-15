import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ImportCollectionRequest } from '@collection-hub/libs';

import { ImportService } from '../imports/import.service';
import { JsonStoreRepository } from '../storage/json-store.repository';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let tempDir: string;
  let repository: JsonStoreRepository;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'xhs-dashboard-'));
    repository = new JsonStoreRepository(join(tempDir, 'store.json'));
  });

  afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true });
  });

  it('returns totals, status counts, recent items, and collection summaries', async () => {
    const importService = new ImportService(repository);
    const dashboardService = new DashboardService(repository);
    const request: ImportCollectionRequest = {
      source: 'xhs',
      status: 'not_downloaded',
      capturedAt: '2026-05-12T15:30:00.000Z',
      collection: {
        id: 'collection-1',
        sourceUrl: 'https://example.test/collections/1',
        title: 'Saved notes',
      },
      items: [
        {
          id: 'note-1',
          title: 'First note',
          noteUrl: 'https://example.test/notes/1',
          mediaType: 'video',
          author: { id: 'author-1', name: 'Alice' },
        },
      ],
    };

    await importService.importCollection(request);
    const dashboard = await dashboardService.getDashboard();

    expect(dashboard.totals).toEqual({
      collections: 3,
      items: 1,
      authors: 1,
    });
    expect(dashboard.statusCounts).toMatchObject({ not_downloaded: 1 });
    expect(dashboard.recentItems[0]).toMatchObject({
      id: 'note-1',
      collectionId: 'xhs:not_downloaded',
      collectionTitle: 'xhs / 不下载',
      authorName: 'Alice',
      source: 'xhs',
      mediaType: 'video',
      status: 'not_downloaded',
    });
    expect(dashboard.items).toEqual([
      expect.objectContaining({
        id: 'note-1',
        collectionId: 'xhs:not_downloaded',
        status: 'not_downloaded',
      }),
    ]);
    expect(
      dashboard.collections.map((collection) => collection.id).sort(),
    ).toEqual(['xhs:downloaded', 'xhs:not_downloaded', 'xhs:pending_download']);
    expect(dashboard.collections).toContainEqual(
      expect.objectContaining({
        id: 'xhs:not_downloaded',
        source: 'xhs',
        status: 'not_downloaded',
        itemCount: 1,
      }),
    );
    expect(dashboard.authors).toEqual([
      expect.objectContaining({
        id: 'author-1',
        source: 'xhs',
        name: 'Alice',
      }),
    ]);
  });

  it('deletes an item from the store and destination collection', async () => {
    const importService = new ImportService(repository);
    const dashboardService = new DashboardService(repository);
    const request: ImportCollectionRequest = {
      source: 'xhs',
      status: 'pending_download',
      capturedAt: '2026-05-12T15:30:00.000Z',
      collection: {
        id: 'collection-1',
        sourceUrl: 'https://example.test/collections/1',
        title: 'Saved notes',
      },
      items: [
        {
          id: 'note-1',
          title: 'First note',
          noteUrl: 'https://example.test/notes/1',
          author: { id: 'author-1', name: 'Alice' },
        },
        {
          id: 'note-2',
          title: 'Second note',
          noteUrl: 'https://example.test/notes/2',
          author: { id: 'author-1', name: 'Alice' },
        },
      ],
    };

    await importService.importCollection(request);
    await expect(dashboardService.deleteItem('note-1')).resolves.toEqual({
      deleted: true,
      itemId: 'note-1',
    });

    const store = await repository.read();
    expect(store.items['note-1']).toBeUndefined();
    expect(store.items['note-2']).toBeDefined();
    expect(store.collections['xhs:pending_download']?.itemIds).toEqual([
      'note-2',
    ]);

    const dashboard = await dashboardService.getDashboard();
    expect(dashboard.totals.items).toBe(1);
    expect(dashboard.collections).toContainEqual(
      expect.objectContaining({
        id: 'xhs:pending_download',
        itemCount: 1,
      }),
    );
  });

  it('bulk deletes only items matching the requested source and status', async () => {
    const importService = new ImportService(repository);
    const dashboardService = new DashboardService(repository);
    const request: ImportCollectionRequest = {
      source: 'xhs',
      status: 'pending_download',
      capturedAt: '2026-05-12T15:30:00.000Z',
      collection: {
        id: 'collection-1',
        sourceUrl: 'https://example.test/collections/1',
        title: 'Saved notes',
      },
      items: [
        {
          id: 'note-1',
          title: 'First note',
          noteUrl: 'https://example.test/notes/1',
        },
        {
          id: 'note-2',
          title: 'Second note',
          noteUrl: 'https://example.test/notes/2',
        },
      ],
    };

    await importService.importCollection(request);
    await importService.importCollection({
      ...request,
      status: 'downloaded',
      items: [request.items[1]],
    });

    await expect(
      dashboardService.deleteItems({
        source: 'xhs',
        status: 'pending_download',
        itemIds: ['note-1', 'note-2', 'missing-note'],
      }),
    ).resolves.toMatchObject({
      deletedItems: 1,
      skippedItems: 2,
      itemIds: ['note-1'],
    });

    const store = await repository.read();
    expect(store.items['note-1']).toBeUndefined();
    expect(store.items['note-2']).toMatchObject({
      status: 'downloaded',
    });
    expect(store.collections['xhs:pending_download']?.itemIds).toEqual([]);
    expect(store.collections['xhs:downloaded']?.itemIds).toEqual(['note-2']);
  });

  it('moves an item to another destination collection', async () => {
    const importService = new ImportService(repository);
    const dashboardService = new DashboardService(repository);
    const request: ImportCollectionRequest = {
      source: 'xhs',
      status: 'pending_download',
      capturedAt: '2026-05-12T15:30:00.000Z',
      collection: {
        id: 'collection-1',
        sourceUrl: 'https://example.test/collections/1',
        title: 'Saved notes',
      },
      items: [
        {
          id: 'note-1',
          title: 'First note',
          noteUrl: 'https://example.test/notes/1',
        },
        {
          id: 'note-2',
          title: 'Second note',
          noteUrl: 'https://example.test/notes/2',
        },
      ],
    };

    await importService.importCollection(request);

    await expect(
      dashboardService.moveItem('note-1', 'downloaded'),
    ).resolves.toMatchObject({
      collectionId: 'xhs:downloaded',
      itemId: 'note-1',
      moved: true,
      source: 'xhs',
      status: 'downloaded',
    });

    const store = await repository.read();
    expect(store.items['note-1']).toMatchObject({
      collectionId: 'xhs:downloaded',
      status: 'downloaded',
    });
    expect(store.collections['xhs:pending_download']?.itemIds).toEqual([
      'note-2',
    ]);
    expect(store.collections['xhs:downloaded']?.itemIds).toEqual(['note-1']);

    const dashboard = await dashboardService.getDashboard();
    expect(dashboard.statusCounts).toMatchObject({
      downloaded: 1,
      pending_download: 1,
    });
  });

  it('rates an item and exposes the rating in dashboard summaries', async () => {
    const importService = new ImportService(repository);
    const dashboardService = new DashboardService(repository);
    const request: ImportCollectionRequest = {
      source: 'xhs',
      status: 'pending_download',
      capturedAt: '2026-05-12T15:30:00.000Z',
      collection: {
        id: 'collection-1',
        sourceUrl: 'https://example.test/collections/1',
        title: 'Saved notes',
      },
      items: [
        {
          id: 'note-1',
          title: 'First note',
          noteUrl: 'https://example.test/notes/1',
        },
      ],
    };

    await importService.importCollection(request);

    await expect(
      dashboardService.rateItem('note-1', 'S'),
    ).resolves.toMatchObject({
      itemId: 'note-1',
      rating: 'S',
    });

    const store = await repository.read();
    expect(store.items['note-1']).toMatchObject({
      rating: 'S',
    });

    const dashboard = await dashboardService.getDashboard();
    expect(dashboard.items[0]).toMatchObject({
      id: 'note-1',
      rating: 'S',
    });
    expect(dashboard.recentItems[0]).toMatchObject({
      id: 'note-1',
      rating: 'S',
    });
  });

  it('returns a non-deleted result for a missing item', async () => {
    const dashboardService = new DashboardService(repository);

    await expect(dashboardService.deleteItem('missing-note')).resolves.toEqual({
      deleted: false,
      itemId: 'missing-note',
    });
  });

  it('returns null when moving a missing item', async () => {
    const dashboardService = new DashboardService(repository);

    await expect(
      dashboardService.moveItem('missing-note', 'downloaded'),
    ).resolves.toBeNull();
  });

  it('returns null when rating a missing item', async () => {
    const dashboardService = new DashboardService(repository);

    await expect(
      dashboardService.rateItem('missing-note', 'A'),
    ).resolves.toBeNull();
  });
});
