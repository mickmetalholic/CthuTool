import { describe, expect, test } from 'bun:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strToU8, unzipSync, zipSync } from 'fflate';
import { scheduleTasks } from '../../../../scripts/convert-to-cbz/application/schedule-tasks';
import { epubConverter } from '../../../../scripts/convert-to-cbz/infrastructure/converters/epub-converter';
import { scanTargetFiles } from '../../../../scripts/convert-to-cbz/infrastructure/scanners/file-scanner';

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('epub-convert-multi-images', () => {
  test('writes all extracted epub images into cbz', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-epub-cbz-'));
    const epubPath = join(root, 'book.epub');
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

    const options = {
      input: root,
      imageFormat: 'jpg' as const,
      imageQuality: 90,
      dpi: 200,
      fileConcurrency: 1,
      epubRenderConcurrency: 1,
    };

    const files = await scanTargetFiles(options);
    const results = await scheduleTasks(files, [epubConverter], options);
    expect(results.length).toBe(1);
    expect(results[0]?.ok).toBe(true);

    const cbzPath = files[0]?.targetCbzPath;
    expect(cbzPath).toBeDefined();
    const cbzBuffer = await Bun.file(cbzPath as string).arrayBuffer();
    const entries = unzipSync(new Uint8Array(cbzBuffer));
    const names = Object.keys(entries).sort();
    expect(names).toEqual(['0001.png', '0002.jpg']);
  });
});
