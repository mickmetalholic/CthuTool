import { describe, expect, mock, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createBrowserAuthBundle,
  extractDoubanUserIdentity,
  runBrowserAuthLogin,
} from '../../src/domain/browser-auth-helper';

describe('browser auth helper', () => {
  test('creates password-free auth bundle metadata', () => {
    const bundle = createBrowserAuthBundle({
      allowedOrigins: ['https://movie.douban.com'],
      loginUrl: 'https://accounts.douban.com/passport/login',
      now: () => new Date('2026-06-12T00:00:00.000Z'),
      profileName: 'douban',
      source: 'cli-helper',
      storageState: {
        cookies: [{ name: 'dbcl2', value: 'secret' }],
        origins: [],
      },
      verifyUrl: 'https://movie.douban.com/',
    });

    expect(bundle.meta).toEqual({
      allowedOrigins: ['https://movie.douban.com'],
      createdAt: '2026-06-12T00:00:00.000Z',
      loginUrl: 'https://accounts.douban.com/passport/login',
      profileName: 'douban',
      source: 'cli-helper',
      updatedAt: '2026-06-12T00:00:00.000Z',
      verifyUrl: 'https://movie.douban.com/',
    });
    expect(JSON.stringify(bundle)).not.toContain('password');
  });

  test('runs manual login and writes auth bundle to output directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-cli-auth-'));
    const browser = mockBrowser();

    try {
      const result = await runBrowserAuthLogin(
        {
          loginUrl: 'https://accounts.douban.com/passport/login',
          outputRoot: root,
          profileName: 'douban',
          verifyUrl: 'https://movie.douban.com/',
        },
        {
          launchBrowser: async () => browser,
          now: () => new Date('2026-06-12T00:00:00.000Z'),
          waitForUser: async () => undefined,
        },
      );

      expect(browser.page.goto).toHaveBeenCalledWith(
        'https://accounts.douban.com/passport/login',
      );
      expect(browser.context.storageState).toHaveBeenCalledTimes(1);
      expect(browser.browser.close).toHaveBeenCalledTimes(1);
      expect(result.profilePath).toBe(join(root, 'douban'));
      expect(JSON.parse(await readFile(result.storageStatePath, 'utf8'))).toEqual(
        {
          cookies: [{ name: 'dbcl2', value: 'secret' }],
          origins: [],
        },
      );
      expect(JSON.parse(await readFile(result.metaPath, 'utf8'))).toEqual({
        createdAt: '2026-06-12T00:00:00.000Z',
        loginUrl: 'https://accounts.douban.com/passport/login',
        profileName: 'douban',
        source: 'cli-helper',
        updatedAt: '2026-06-12T00:00:00.000Z',
        verifyUrl: 'https://movie.douban.com/',
      });
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  test('extracts minimal Douban user identity from the profile page', () => {
    expect(
      extractDoubanUserIdentity({
        finalUrl: 'https://www.douban.com/people/123456789/',
        pageText: '豆瓣\n阿圆的豆瓣主页\n关注 12',
        title: '阿圆的豆瓣',
      }),
    ).toEqual({
      id: '123456789',
      nickname: '阿圆',
    });
  });
});

function mockBrowser() {
  const page = {
    goto: mock(async () => undefined),
  };
  const context = {
    newPage: mock(async () => page),
    storageState: mock(async () => ({
      cookies: [{ name: 'dbcl2', value: 'secret' }],
      origins: [],
    })),
  };
  const browser = {
    close: mock(async () => undefined),
    newContext: mock(async () => context),
  };
  return { browser, context, page };
}
