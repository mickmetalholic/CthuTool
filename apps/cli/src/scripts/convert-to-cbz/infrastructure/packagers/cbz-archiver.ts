import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import archiver from 'archiver';
import type { PageAsset } from '../../domain/conversion-types';

export const writeCbzArchive = async (
  targetCbzPath: string,
  pages: ReadonlyArray<PageAsset>,
): Promise<void> => {
  await mkdir(dirname(targetCbzPath), { recursive: true });
  const ordered = [...pages].sort((a, b) => a.index - b.index);

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(targetCbzPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);
    for (const page of ordered) {
      archive.file(page.tempPath, { name: page.archiveName });
    }
    void archive.finalize();
  });
};
