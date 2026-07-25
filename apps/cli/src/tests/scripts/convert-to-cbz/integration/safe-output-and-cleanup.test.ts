import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { buildConversionSummary } from '../../../../scripts/convert-to-cbz/application/run-conversion-job';
import { scheduleTasks } from '../../../../scripts/convert-to-cbz/application/schedule-tasks';
import type { ConversionOptions } from '../../../../scripts/convert-to-cbz/domain/conversion-types';
import type { Converter } from '../../../../scripts/convert-to-cbz/domain/converter';
import { toArchiveName } from '../../../../scripts/convert-to-cbz/domain/path-mapping';
import { createTemporaryWorkspace } from '../../../../scripts/convert-to-cbz/infrastructure/workspace/temporary-workspace';

const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0x01, 0xd9]);

const optionsFor = (root: string, overwrite: boolean): ConversionOptions => ({
  dpi: 200,
  epubRenderConcurrency: 1,
  fileConcurrency: 1,
  imageFormat: 'jpg',
  imageQuality: 90,
  input: root,
  output: join(root, 'output'),
  overwrite,
});

const fileFor = (root: string) => ({
  relativePath: 'book.epub',
  sourcePath: join(root, 'book.epub'),
  sourceType: 'epub' as const,
  targetCbzPath: join(root, 'output', 'book.cbz'),
});

const converterWriting = (content: Uint8Array): Converter => ({
  sourceType: 'epub',
  async convert(_file, context) {
    const tempPath = join(context.workspace.rootPath, 'page.jpg');
    await writeFile(tempPath, content);
    return {
      ok: true,
      pages: [
        {
          archiveName: toArchiveName(1, 'jpg'),
          format: 'jpg',
          index: 1,
          quality: 90,
          tempPath,
        },
      ],
    };
  },
});

describe('safe output and cleanup', () => {
  test('skips an existing target by default without invoking the converter', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-safe-skip-'));
    const file = fileFor(root);
    const original = new Uint8Array([1, 2, 3, 4]);
    await writeFile(file.sourcePath, 'source');
    await mkdir(join(root, 'output'), { recursive: true });
    await writeFile(file.targetCbzPath, original);
    let converted = false;
    const converter: Converter = {
      sourceType: 'epub',
      async convert() {
        converted = true;
        throw new Error('should not run');
      },
    };

    const [result] = await scheduleTasks(
      [file],
      [converter],
      optionsFor(root, false),
    );

    expect(result?.status).toBe('skipped');
    expect(converted).toBe(false);
    expect(new Uint8Array(await readFile(file.targetCbzPath))).toEqual(
      original,
    );
  });

  test('writes a validated deterministic CBZ and disposes its workspace', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-safe-write-'));
    const file = fileFor(root);
    await writeFile(file.sourcePath, 'source');
    let workspacePath = '';

    const [result] = await scheduleTasks(
      [file],
      [converterWriting(JPG_BYTES)],
      optionsFor(root, false),
      undefined,
      {
        createWorkspace: async () => {
          const workspace = await createTemporaryWorkspace();
          workspacePath = workspace.rootPath;
          return workspace;
        },
      },
    );

    expect(result?.status).toBe('converted');
    const archive = unzipSync(await readFile(file.targetCbzPath));
    expect(Object.keys(archive)).toEqual(['0001.jpg']);
    expect(archive['0001.jpg']).toEqual(JPG_BYTES);
    expect(await readdir(workspacePath).catch(() => undefined)).toBeUndefined();
    expect(
      (await readdir(join(root, 'output'))).some(
        (name) => name.includes('.partial') || name.includes('.backup'),
      ),
    ).toBe(false);
  });

  test('replaces an existing target only after a successful overwrite', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-safe-overwrite-'));
    const file = fileFor(root);
    await writeFile(file.sourcePath, 'source');
    await mkdir(join(root, 'output'), { recursive: true });
    await writeFile(file.targetCbzPath, new Uint8Array([9, 8, 7, 6]));

    const [result] = await scheduleTasks(
      [file],
      [converterWriting(JPG_BYTES)],
      optionsFor(root, true),
    );

    expect(result?.status).toBe('converted');
    expect(unzipSync(await readFile(file.targetCbzPath))['0001.jpg']).toEqual(
      JPG_BYTES,
    );
    expect(
      (await readdir(join(root, 'output'))).some(
        (name) => name.includes('.partial') || name.includes('.backup'),
      ),
    ).toBe(false);
  });

  test('preserves an existing target when overwrite validation fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-safe-fail-'));
    const file = fileFor(root);
    const original = new Uint8Array([9, 8, 7, 6]);
    await writeFile(file.sourcePath, 'source');
    await mkdir(join(root, 'output'), { recursive: true });
    await writeFile(file.targetCbzPath, original);
    let workspacePath = '';

    const [result] = await scheduleTasks(
      [file],
      [converterWriting(new Uint8Array([1, 2, 3]))],
      optionsFor(root, true),
      undefined,
      {
        createWorkspace: async () => {
          const workspace = await createTemporaryWorkspace();
          workspacePath = workspace.rootPath;
          return workspace;
        },
      },
    );

    expect(result?.status).toBe('failed');
    expect(result?.failure?.stage).toBe('archive');
    expect(new Uint8Array(await readFile(file.targetCbzPath))).toEqual(
      original,
    );
    expect(await readdir(workspacePath).catch(() => undefined)).toBeUndefined();
    expect(
      (await readdir(join(root, 'output'))).some(
        (name) => name.includes('.partial') || name.includes('.backup'),
      ),
    ).toBe(false);
  });

  test('summaries distinguish converted, skipped, and failed tasks', () => {
    const summary = buildConversionSummary(
      3,
      [
        { ok: true, sourcePath: 'a.pdf', status: 'converted' },
        { ok: true, sourcePath: 'b.pdf', status: 'skipped' },
        {
          failure: {
            reason: 'broken',
            recoverable: true,
            sourcePath: 'c.epub',
            stage: 'convert',
          },
          ok: false,
          sourcePath: 'c.epub',
          status: 'failed',
        },
      ],
      'output',
      10,
    );

    expect(summary).toMatchObject({
      convertedCount: 1,
      failureCount: 1,
      skippedCount: 1,
      successCount: 2,
      totalFiles: 3,
    });
  });
});
