import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBrowserExtensionAuthBundle } from './browser-auth-extension';
import { BrowserAuthStateStore } from './browser-auth-state.store';

describe('browser extension auth conversion', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-extension-auth-'));
  });

  afterEach(async () => {
    await rm(root, { force: true, recursive: true });
  });

  it('accepts extension-shaped auth data only after conversion to the shared bundle format', async () => {
    const store = new BrowserAuthStateStore({ authStateDir: root });
    const extensionSnapshot = {
      allowedOrigins: ['https://movie.douban.com'],
      cookies: [
        {
          domain: '.douban.com',
          expires: -1,
          httpOnly: true,
          name: 'dbcl2',
          path: '/',
          sameSite: 'Lax',
          secure: true,
          value: 'secret-cookie',
        },
      ],
      originStorage: [
        {
          localStorage: [{ name: 'viewed', value: 'yes' }],
          origin: 'https://movie.douban.com',
        },
      ],
      profileName: 'douban',
      updatedAt: '2026-06-12T00:00:00.000Z',
      verifyUrl: 'https://movie.douban.com/',
    };

    await expect(
      store.writeBundle('douban', extensionSnapshot as never),
    ).rejects.toMatchObject({ code: 'INVALID_AUTH_BUNDLE' });

    const bundle = createBrowserExtensionAuthBundle(extensionSnapshot);
    expect(bundle).toEqual({
      meta: {
        allowedOrigins: ['https://movie.douban.com'],
        profileName: 'douban',
        source: 'browser-extension',
        updatedAt: '2026-06-12T00:00:00.000Z',
        verifyUrl: 'https://movie.douban.com/',
      },
      storageState: {
        cookies: [expect.objectContaining({ name: 'dbcl2' })],
        origins: [
          {
            localStorage: [{ name: 'viewed', value: 'yes' }],
            origin: 'https://movie.douban.com',
          },
        ],
      },
    });

    await expect(store.writeBundle('douban', bundle)).resolves.toBeUndefined();
    await expect(store.getProfileStatus('douban')).resolves.toMatchObject({
      source: 'browser-extension',
      status: 'available',
    });
  });
});
