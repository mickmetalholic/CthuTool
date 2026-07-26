import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { epubConverter } from '../../../../scripts/convert-to-cbz/infrastructure/converters/epub-converter';

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

const createContext = (rootPath: string) => ({
  options: {
    dpi: 200,
    epubRenderConcurrency: 1,
    fileConcurrency: 1,
    imageFormat: 'jpg' as const,
    imageQuality: 80,
    input: rootPath,
    overwrite: false,
  },
  workspace: {
    rootPath,
    dispose: async () => undefined,
  },
});

describe('epub-converter', () => {
  test('extracts XHTML and SVG pages in spine order without deduplicating occurrences', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-epub-test-'));
    const epubPath = join(root, 'sample.epub');
    const epubBytes = zipSync({
      'META-INF/container.xml': strToU8(
        '<?xml version="1.0"?><container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>',
      ),
      'OEBPS/content.opf': strToU8(
        '<?xml version="1.0"?><package><manifest><item id="c1" href="pages/chapter1.xhtml"/><item id="c2" href="pages/chapter2.svg"/><item id="c3" href="pages/chapter3.svg"/><item id="c4" href="pages/chapter1.xhtml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/><itemref idref="c3"/><itemref idref="c4"/></spine></package>',
      ),
      'OEBPS/pages/chapter1.xhtml': strToU8(
        '<html><body><img src="../images/001.png"/></body></html>',
      ),
      'OEBPS/pages/chapter2.svg': strToU8(
        '<svg><image href="../images/002%20page.jpg"/></svg>',
      ),
      'OEBPS/pages/chapter3.svg': strToU8(
        '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><image xlink:href="../images/003.webp"/></svg>',
      ),
      'OEBPS/images/001.png': PNG_BYTES,
      'OEBPS/images/002 page.jpg': JPG_BYTES,
      'OEBPS/images/003.webp': WEBP_BYTES,
    });
    await writeFile(epubPath, epubBytes);

    const result = await epubConverter.convert(
      {
        relativePath: 'sample.epub',
        sourcePath: epubPath,
        sourceType: 'epub',
        targetCbzPath: join(root, 'sample.cbz'),
      },
      createContext(root),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pages.map((page) => page.archiveName)).toEqual([
      '0001.png',
      '0002.jpg',
      '0003.webp',
      '0004.png',
    ]);
    expect(
      new Uint8Array(await readFile(result.pages[0]?.tempPath ?? '')),
    ).toEqual(PNG_BYTES);
    expect(
      new Uint8Array(await readFile(result.pages[1]?.tempPath ?? '')),
    ).toEqual(JPG_BYTES);
    expect(
      new Uint8Array(await readFile(result.pages[2]?.tempPath ?? '')),
    ).toEqual(WEBP_BYTES);
    expect(
      new Uint8Array(await readFile(result.pages[3]?.tempPath ?? '')),
    ).toEqual(PNG_BYTES);
  });

  test('fails instead of generating a placeholder when no valid page image exists', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-epub-empty-'));
    const epubPath = join(root, 'empty.epub');
    await writeFile(
      epubPath,
      zipSync({
        'META-INF/container.xml': strToU8(
          '<container><rootfiles><rootfile full-path="content.opf"/></rootfiles></container>',
        ),
        'content.opf': strToU8(
          '<package><manifest><item id="c1" href="chapter.xhtml"/></manifest><spine><itemref idref="c1"/></spine></package>',
        ),
        'chapter.xhtml': strToU8('<html><body><p>Text only</p></body></html>'),
      }),
    );

    const result = await epubConverter.convert(
      {
        relativePath: 'empty.epub',
        sourcePath: epubPath,
        sourceType: 'epub',
        targetCbzPath: join(root, 'empty.cbz'),
      },
      createContext(root),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.reason).toContain('no valid ordered');
  });
});
