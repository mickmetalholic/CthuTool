import { describe, expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scheduleTasks } from '../../../../scripts/convert-to-cbz/application/schedule-tasks';
import type { Converter } from '../../../../scripts/convert-to-cbz/domain/converter';
import { toArchiveName } from '../../../../scripts/convert-to-cbz/domain/path-mapping';
import { scanTargetFiles } from '../../../../scripts/convert-to-cbz/infrastructure/scanners/file-scanner';

const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('batch-convert-success', () => {
  test('converts mixed files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-batch-'));
    await writeFile(join(root, 'book1.pdf'), JPG_BYTES);
    await writeFile(join(root, 'book2.epub'), JPG_BYTES);
    const options = {
      input: root,
      imageFormat: 'jpg' as const,
      imageQuality: 90,
      dpi: 200,
      fileConcurrency: 2,
      epubRenderConcurrency: 1,
    };
    const files = await scanTargetFiles(options);
    const converters: ReadonlyArray<Converter> = [
      {
        sourceType: 'pdf',
        async convert(file, ctx) {
          return {
            ok: true,
            pages: [
              {
                index: 1,
                tempPath: file.sourcePath,
                archiveName: toArchiveName(1, ctx.options.imageFormat),
                format: ctx.options.imageFormat,
                quality: ctx.options.imageQuality,
              },
            ],
          };
        },
      },
      {
        sourceType: 'epub',
        async convert(file, ctx) {
          return {
            ok: true,
            pages: [
              {
                index: 1,
                tempPath: file.sourcePath,
                archiveName: toArchiveName(1, ctx.options.imageFormat),
                format: ctx.options.imageFormat,
                quality: ctx.options.imageQuality,
              },
            ],
          };
        },
      },
    ];
    const result = await scheduleTasks(files, converters, options);
    expect(result.filter((x) => x.ok).length).toBe(2);
  });
});
