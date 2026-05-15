import { Inject, Injectable, Optional } from '@nestjs/common';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';

import {
  createEmptyStore,
  type CollectionHubStore,
} from '@collection-hub/libs';

export const COLLECTION_HUB_STORE_PATH = 'COLLECTION_HUB_STORE_PATH';

export function resolveCollectionHubStorePath(): string {
  return (
    process.env.COLLECTION_HUB_STORE_PATH ??
    join(process.cwd(), 'data', 'store.json')
  );
}

@Injectable()
export class JsonStoreRepository {
  constructor(
    @Optional()
    @Inject(COLLECTION_HUB_STORE_PATH)
    private readonly storePath: string = resolveCollectionHubStorePath(),
  ) {}

  async read(): Promise<CollectionHubStore> {
    try {
      const raw = await readFile(this.storePath, 'utf8');
      return JSON.parse(raw) as CollectionHubStore;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return createEmptyStore();
      }
      throw error;
    }
  }

  async write(store: CollectionHubStore): Promise<void> {
    const directory = dirname(this.storePath);
    const tempPath = join(
      directory,
      `.${basename(this.storePath)}.${process.pid}.${Date.now()}.tmp`,
    );

    await mkdir(directory, { recursive: true });
    try {
      await writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
      await rename(tempPath, this.storePath);
    } catch (error) {
      await rm(tempPath, { force: true });
      throw error;
    }
  }

  async update<T>(
    mutator: (store: CollectionHubStore) => T | Promise<T>,
  ): Promise<T> {
    const store = await this.read();
    const nextStore = structuredClone(store);
    const result = await mutator(nextStore);
    await this.write(nextStore);
    return result;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
