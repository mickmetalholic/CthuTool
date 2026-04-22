import { describe, expect, test } from 'bun:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { epubConverter } from '../../../../scripts/convert-to-cbz/infrastructure/converters/epub-converter';

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('epub-converter', () => {
  test('extracts all chapter images instead of first only', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-epub-test-'));
    const epubPath = join(root, 'sample.epub');
    const epubBytes = zipSync({
      'META-INF/container.xml': strToU8(
        '<?xml version="1.0"?><container><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>',
      ),
      'OEBPS/content.opf': strToU8(
        '<?xml version="1.0"?><package><manifest><item id="c1" href="chapter1.xhtml"/><item id="c2" href="chapter2.xhtml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/></spine></package>',
      ),
      'OEBPS/chapter1.xhtml': strToU8(
        '<html><body><img src="images/001.png"/></body></html>',
      ),
      'OEBPS/chapter2.xhtml': strToU8(
        '<html><body><img src="images/002.jpg"/></body></html>',
      ),
      'OEBPS/images/001.png': PNG_BYTES,
      'OEBPS/images/002.jpg': JPG_BYTES,
    });
    await Bun.write(epubPath, epubBytes);

    const result = await epubConverter.convert(
      {
        sourcePath: epubPath,
        relativePath: 'sample.epub',
        sourceType: 'epub',
        targetCbzPath: join(root, 'sample.cbz'),
      },
      {
        options: {
          input: root,
          imageFormat: 'jpg',
          imageQuality: 80,
          dpi: 200,
          fileConcurrency: 1,
          epubRenderConcurrency: 1,
        },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pages.length).toBe(2);
    expect(result.pages[0]?.archiveName).toBe('0001.png');
    expect(result.pages[1]?.archiveName).toBe('0002.jpg');
  });
});
