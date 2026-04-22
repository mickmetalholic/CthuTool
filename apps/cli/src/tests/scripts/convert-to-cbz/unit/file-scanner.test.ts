import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanTargetFiles } from '../../../../scripts/convert-to-cbz/infrastructure/scanners/file-scanner';

describe('file-scanner', () => {
  test('scan recursive pdf and epub files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthu-scan-'));
    await mkdir(join(root, 'nested'), { recursive: true });
    await writeFile(join(root, 'a.pdf'), '');
    await writeFile(join(root, 'nested', 'b.EPUB'), '');
    const files = await scanTargetFiles({
      input: root,
      imageFormat: 'jpg',
      imageQuality: 90,
      dpi: 200,
      fileConcurrency: 2,
      epubRenderConcurrency: 1,
    });
    expect(files.length).toBe(2);
  });
});
