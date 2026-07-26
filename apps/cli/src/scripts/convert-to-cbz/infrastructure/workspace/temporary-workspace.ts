import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ConversionWorkspace } from '../../domain/conversion-types';

export const createTemporaryWorkspace =
  async (): Promise<ConversionWorkspace> => {
    const rootPath = await mkdtemp(join(tmpdir(), 'cthu-comic-'));
    let disposed = false;

    return {
      rootPath,
      async dispose() {
        if (disposed) return;
        disposed = true;
        await rm(rootPath, { force: true, recursive: true });
      },
    };
  };
