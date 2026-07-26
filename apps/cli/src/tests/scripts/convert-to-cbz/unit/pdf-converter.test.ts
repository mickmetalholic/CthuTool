import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPdfConverter,
  parsePdfImagesList,
  planPdfPages,
} from '../../../../scripts/convert-to-cbz/infrastructure/converters/pdf-converter';

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '../fixtures',
);
const EXTRACTED_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0x01, 0xd9]);
const RENDERED_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0x02, 0xd9]);

describe('pdf-converter', () => {
  test('classifies full-page JPEG, lossless, composed, masked, and partial pages', async () => {
    const list = await readFile(
      join(fixtureRoot, 'pdfimages-mixed-list.txt'),
      'utf8',
    );
    const pageSizes = new Map(
      [1, 2, 3, 4, 5].map((page) => [page, { height: 800, width: 600 }]),
    );

    expect(planPdfPages(5, pageSizes, parsePdfImagesList(list))).toEqual([
      { kind: 'extract-jpeg', page: 1 },
      { kind: 'extract-png', page: 2 },
      { kind: 'render', page: 3, reason: 'multiple visible images' },
      {
        kind: 'render',
        page: 4,
        reason: 'image mask requires composition',
      },
      {
        kind: 'render',
        page: 5,
        reason: 'image does not cover the complete page',
      },
    ]);
  });

  test('preserves an extracted JPEG and renders only the composed page', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-pdf-test-'));
    const calls: string[] = [];
    const converter = createPdfConverter({
      runCommand: async (bin, args) => {
        calls.push(`${bin} ${args.join(' ')}`);
        if (bin === 'pdfinfo') {
          return {
            code: 0,
            stderr: '',
            stdout: 'Pages: 2\nPage size: 600 x 800 pts\n',
          };
        }
        if (bin === 'pdfimages' && args[0] === '-list') {
          return {
            code: 0,
            stderr: '',
            stdout: [
              '1 0 image 1200 1600 rgb 3 8 jpeg no 10 0 144 144 1M 20%',
              '2 1 image 600 800 rgb 3 8 jpeg no 11 0 72 72 500K 20%',
              '2 2 image 600 800 rgb 3 8 jpeg no 12 0 72 72 500K 20%',
            ].join('\n'),
          };
        }
        const prefix = args.at(-1);
        if (!prefix) throw new Error('missing output prefix');
        if (bin === 'pdfimages') {
          await writeFile(`${prefix}-000.jpg`, EXTRACTED_JPEG);
        } else {
          await writeFile(`${prefix}.jpg`, RENDERED_JPEG);
        }
        return { code: 0, stderr: '', stdout: '' };
      },
    });

    const result = await converter.convert(
      {
        relativePath: 'mixed.pdf',
        sourcePath: join(root, 'mixed.pdf'),
        sourceType: 'pdf',
        targetCbzPath: join(root, 'mixed.cbz'),
      },
      {
        options: {
          dpi: 200,
          epubRenderConcurrency: 1,
          fileConcurrency: 1,
          imageFormat: 'jpg',
          imageQuality: 90,
          input: root,
        },
        workspace: {
          rootPath: root,
          dispose: async () => undefined,
        },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pages.map((page) => page.archiveName)).toEqual([
      '0001.jpg',
      '0002.jpg',
    ]);
    expect(
      new Uint8Array(await readFile(result.pages[0]?.tempPath ?? '')),
    ).toEqual(EXTRACTED_JPEG);
    expect(
      new Uint8Array(await readFile(result.pages[1]?.tempPath ?? '')),
    ).toEqual(RENDERED_JPEG);
    expect(
      calls.filter((call) => call.startsWith('pdfimages -f')),
    ).toHaveLength(1);
    expect(calls.filter((call) => call.startsWith('pdftoppm '))).toHaveLength(
      1,
    );
  });
});
