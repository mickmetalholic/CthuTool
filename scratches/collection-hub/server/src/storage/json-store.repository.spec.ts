import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createEmptyStore,
  type CollectionHubStore,
} from '@collection-hub/libs';

import { JsonStoreRepository } from './json-store.repository';

describe('JsonStoreRepository', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'xhs-store-'));
  });

  afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true });
  });

  it('initializes an empty store when the file is missing', async () => {
    const repository = new JsonStoreRepository(join(tempDir, 'store.json'));

    await expect(repository.read()).resolves.toEqual(createEmptyStore());
  });

  it('writes the store through a temp file and leaves only the final store file', async () => {
    const repository = new JsonStoreRepository(join(tempDir, 'store.json'));
    const store: CollectionHubStore = {
      collections: {
        'xhs:pending_download': {
          id: 'xhs:pending_download',
          source: 'xhs',
          status: 'pending_download',
          sourceUrl: 'https://example.test/collections/1',
          title: 'xhs / 待下载',
          itemIds: [],
          importedAt: '2026-05-12T15:30:00.000Z',
          updatedAt: '2026-05-12T15:30:00.000Z',
        },
      },
      items: {},
      authors: {},
    };

    await repository.write(store);

    await expect(repository.read()).resolves.toEqual(store);
    await expect(
      readFile(join(tempDir, 'store.json'), 'utf8'),
    ).resolves.toContain('xhs / 待下载');
    await expect(readdir(tempDir)).resolves.toEqual(['store.json']);
  });
});
