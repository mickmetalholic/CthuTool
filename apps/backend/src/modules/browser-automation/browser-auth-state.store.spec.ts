import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BrowserAuthStateStore } from './browser-auth-state.store';

describe('BrowserAuthStateStore', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-auth-'));
  });

  afterEach(async () => {
    await rm(root, { force: true, recursive: true });
  });

  it('stores and reads a valid auth bundle without exposing raw state in status', async () => {
    const store = new BrowserAuthStateStore({ authStateDir: root });

    await store.writeBundle('douban', {
      meta: {
        profileName: 'douban',
        source: 'cli-helper',
        createdAt: '2026-06-12T00:00:00.000Z',
        updatedAt: '2026-06-12T00:00:00.000Z',
      },
      storageState: {
        cookies: [
          {
            name: 'secret',
            value: 'cookie-value',
            domain: '.douban.com',
            path: '/',
            expires: -1,
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    await expect(store.hasProfile('douban')).resolves.toBe(true);
    await expect(store.readStorageState('douban')).resolves.toEqual({
      cookies: [
        expect.objectContaining({
          name: 'secret',
          value: 'cookie-value',
        }),
      ],
      origins: [],
    });

    const status = await store.getProfileStatus('douban');
    expect(status).toEqual({
      profileName: 'douban',
      source: 'cli-helper',
      status: 'available',
      updatedAt: '2026-06-12T00:00:00.000Z',
    });
    expect(JSON.stringify(status)).not.toContain('cookie-value');
  });

  it('rejects invalid profile names and preserves existing bundles', async () => {
    const store = new BrowserAuthStateStore({ authStateDir: root });
    await store.writeBundle('douban', {
      meta: {
        profileName: 'douban',
        source: 'cli-helper',
        updatedAt: '2026-06-12T00:00:00.000Z',
      },
      storageState: { cookies: [], origins: [] },
    });

    await expect(
      store.writeBundle('../douban', {
        meta: {
          profileName: '../douban',
          source: 'cli-helper',
          updatedAt: '2026-06-12T00:00:00.000Z',
        },
        storageState: { cookies: [], origins: [] },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_AUTH_BUNDLE' });

    const stored = await readFile(
      join(root, 'douban', 'storage-state.json'),
      'utf8',
    );
    expect(JSON.parse(stored)).toEqual({ cookies: [], origins: [] });
  });

  it('rejects invalid storage-state files when reading', async () => {
    const store = new BrowserAuthStateStore({ authStateDir: root });
    await store.writeBundle('douban', {
      meta: {
        profileName: 'douban',
        source: 'cli-helper',
        updatedAt: '2026-06-12T00:00:00.000Z',
      },
      storageState: { cookies: [], origins: [] },
    });
    await writeFile(
      join(root, 'douban', 'storage-state.json'),
      JSON.stringify({ cookies: 'bad', origins: [] }),
      'utf8',
    );

    await expect(store.readStorageState('douban')).rejects.toMatchObject({
      code: 'INVALID_AUTH_BUNDLE',
    });
  });
});
