import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';

describe('BrowserDiagnosticsStore', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-diagnostics-'));
  });

  afterEach(async () => {
    await rm(root, { force: true, recursive: true });
  });

  it('stores diagnostics behind an identifier without returning raw artifacts', async () => {
    const store = new BrowserDiagnosticsStore({
      diagnosticsDir: root,
      enabled: true,
    });

    const result = await store.save({
      errorCode: 'BLOCKED',
      finalUrl: 'https://movie.douban.com/',
      html: '<html>secret page</html>',
      screenshot: Buffer.from('image-bytes'),
      summary: 'Blocked by site',
    });

    expect(result).toEqual({
      id: expect.any(String),
      summary: 'Blocked by site',
    });
    expect(result).toBeDefined();
    expect(JSON.stringify(result)).not.toContain('secret page');
    const saved = result as NonNullable<typeof result>;

    const metadata = JSON.parse(
      await readFile(join(root, saved.id, 'metadata.json'), 'utf8'),
    );
    expect(metadata).toMatchObject({
      errorCode: 'BLOCKED',
      finalUrl: 'https://movie.douban.com/',
      summary: 'Blocked by site',
    });
    await expect(
      readFile(join(root, saved.id, 'page.html'), 'utf8'),
    ).resolves.toBe('<html>secret page</html>');
  });

  it('returns undefined when diagnostics are disabled', async () => {
    const store = new BrowserDiagnosticsStore({
      diagnosticsDir: root,
      enabled: false,
    });

    await expect(
      store.save({
        errorCode: 'BLOCKED',
        summary: 'Blocked by site',
      }),
    ).resolves.toBeUndefined();
  });
});
