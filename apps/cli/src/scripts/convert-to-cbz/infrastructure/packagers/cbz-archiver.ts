import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, open, rename, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import archiver from 'archiver';
import { Unzip, UnzipInflate } from 'fflate';
import type { ImageFormat, PageAsset } from '../../domain/conversion-types';
import { toArchiveName } from '../../domain/path-mapping';

export class OutputExistsError extends Error {
  constructor(readonly targetPath: string) {
    super(`Output already exists: ${targetPath}`);
    this.name = 'OutputExistsError';
  }
}

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const hasImageSignature = (
  content: Uint8Array,
  format: ImageFormat,
): boolean => {
  if (format === 'jpg') {
    return (
      content.length >= 3 &&
      content[0] === 0xff &&
      content[1] === 0xd8 &&
      content[2] === 0xff
    );
  }
  if (format === 'png') {
    return (
      content.length >= 8 &&
      content[0] === 0x89 &&
      content[1] === 0x50 &&
      content[2] === 0x4e &&
      content[3] === 0x47 &&
      content[4] === 0x0d &&
      content[5] === 0x0a &&
      content[6] === 0x1a &&
      content[7] === 0x0a
    );
  }
  return (
    content.length >= 12 &&
    String.fromCharCode(...content.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...content.subarray(8, 12)) === 'WEBP'
  );
};

const readHeader = async (path: string): Promise<Uint8Array> => {
  const handle = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const validateSourcePages = async (
  pages: ReadonlyArray<PageAsset>,
): Promise<ReadonlyArray<PageAsset>> => {
  if (pages.length === 0) {
    throw new Error('Cannot create a CBZ without page images');
  }
  const ordered = [...pages].sort((left, right) => left.index - right.index);
  const names = new Set<string>();
  for (const [offset, page] of ordered.entries()) {
    const expectedIndex = offset + 1;
    const expectedName = toArchiveName(expectedIndex, page.format);
    if (page.index !== expectedIndex || page.archiveName !== expectedName) {
      throw new Error(
        `Invalid page order at ${page.archiveName}: expected ${expectedName}`,
      );
    }
    if (names.has(page.archiveName)) {
      throw new Error(`Duplicate CBZ page entry: ${page.archiveName}`);
    }
    names.add(page.archiveName);
    if (!hasImageSignature(await readHeader(page.tempPath), page.format)) {
      throw new Error(
        `Invalid ${page.format} image signature: ${page.archiveName}`,
      );
    }
  }
  return ordered;
};

const writeArchiveFile = async (
  partialPath: string,
  pages: ReadonlyArray<PageAsset>,
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const output = createWriteStream(partialPath, { flags: 'wx' });
    const archive = archiver('zip', { zlib: { level: 9 } });
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    output.on('close', () => {
      if (settled) return;
      settled = true;
      resolve();
    });
    output.on('error', fail);
    archive.on('error', fail);
    archive.pipe(output);
    for (const page of pages) {
      archive.file(page.tempPath, { name: page.archiveName });
    }
    void archive.finalize().catch(fail);
  });

const validateArchiveFile = async (
  archivePath: string,
  pages: ReadonlyArray<PageAsset>,
): Promise<void> => {
  const expected = new Map(
    pages.map((page) => [page.archiveName, page.format] as const),
  );
  const seen = new Set<string>();

  await new Promise<void>((resolve, reject) => {
    let inputEnded = false;
    let pendingEntries = 0;
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    };
    const finish = () => {
      if (settled || !inputEnded || pendingEntries !== 0) return;
      const missing = [...expected.keys()].filter((name) => !seen.has(name));
      const unexpected = [...seen].filter((name) => !expected.has(name));
      if (missing.length > 0 || unexpected.length > 0) {
        fail(
          new Error(
            `CBZ entry mismatch (missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'})`,
          ),
        );
        return;
      }
      settled = true;
      resolve();
    };

    const unzip = new Unzip((file) => {
      pendingEntries += 1;
      const chunks: number[] = [];
      file.ondata = (error, data, final) => {
        if (error) {
          fail(error);
          return;
        }
        const remaining = Math.max(0, 12 - chunks.length);
        for (const byte of data.subarray(0, remaining)) chunks.push(byte);
        if (!final) return;
        const format = expected.get(file.name);
        if (!format) {
          seen.add(file.name);
        } else {
          if (!hasImageSignature(Uint8Array.from(chunks), format)) {
            fail(new Error(`Invalid image data in CBZ entry: ${file.name}`));
            return;
          }
          seen.add(file.name);
        }
        pendingEntries -= 1;
        finish();
      };
      try {
        file.start();
      } catch (error) {
        fail(error);
      }
    });
    unzip.register(UnzipInflate);

    const input = createReadStream(archivePath);
    input.on('data', (chunk) => {
      if (settled) return;
      try {
        unzip.push(new Uint8Array(chunk as Buffer));
      } catch (error) {
        fail(error);
      }
    });
    input.on('error', fail);
    input.on('end', () => {
      if (settled) return;
      try {
        unzip.push(new Uint8Array(), true);
        inputEnded = true;
        finish();
      } catch (error) {
        fail(error);
      }
    });
  });
};

const replaceTarget = async (
  partialPath: string,
  targetPath: string,
  overwrite: boolean,
): Promise<void> => {
  if (!overwrite && (await pathExists(targetPath))) {
    throw new OutputExistsError(targetPath);
  }
  try {
    await rename(partialPath, targetPath);
    return;
  } catch (error) {
    if (!overwrite || !(await pathExists(targetPath))) throw error;
  }

  const backupPath = join(
    dirname(targetPath),
    `.${basename(targetPath)}.${randomUUID()}.backup`,
  );
  await rename(targetPath, backupPath);
  try {
    await rename(partialPath, targetPath);
    await rm(backupPath, { force: true });
  } catch (error) {
    await rename(backupPath, targetPath);
    throw error;
  }
};

export const writeCbzArchive = async (
  targetCbzPath: string,
  pages: ReadonlyArray<PageAsset>,
  options: { readonly overwrite?: boolean } = {},
): Promise<void> => {
  const overwrite = options.overwrite === true;
  if (!overwrite && (await pathExists(targetCbzPath))) {
    throw new OutputExistsError(targetCbzPath);
  }
  const ordered = await validateSourcePages(pages);
  await mkdir(dirname(targetCbzPath), { recursive: true });
  const partialPath = join(
    dirname(targetCbzPath),
    `.${basename(targetCbzPath)}.${randomUUID()}.partial`,
  );
  try {
    await writeArchiveFile(partialPath, ordered);
    await validateArchiveFile(partialPath, ordered);
    await replaceTarget(partialPath, targetCbzPath, overwrite);
  } catch (error) {
    await rm(partialPath, { force: true }).catch(() => undefined);
    throw error;
  }
};
