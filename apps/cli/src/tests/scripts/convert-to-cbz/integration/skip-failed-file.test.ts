import { describe, expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scheduleTasks } from '../../../../scripts/convert-to-cbz/application/schedule-tasks';
import type { Converter } from '../../../../scripts/convert-to-cbz/domain/converter';
import { conversionFailure } from '../../../../scripts/convert-to-cbz/domain/errors';
import { toArchiveName } from '../../../../scripts/convert-to-cbz/domain/path-mapping';
import { scanTargetFiles } from '../../../../scripts/convert-to-cbz/infrastructure/scanners/file-scanner';

const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('skip-failed-file', () => {
  test('continues converting other files when one fails', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-skip-fail-'));
    await writeFile(join(root, 'ok.pdf'), JPG_BYTES);
    await writeFile(join(root, 'bad.epub'), '');
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
        async convert(file) {
          return {
            ok: false,
            failure: conversionFailure(
              file.sourcePath,
              'convert',
              'broken input',
            ),
          };
        },
      },
    ];

    const results = await scheduleTasks(files, converters, options);
    expect(results.filter((x) => x.ok).length).toBe(1);
    expect(results.filter((x) => !x.ok).length).toBe(1);
  });
});
