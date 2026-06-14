import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigError } from '@cthutool/config';
import { SitesConfigService } from './sites-config.service';

describe('SitesConfigService', () => {
  it('loads built-in browser sites by default', async () => {
    const service = await SitesConfigService.create();

    expect(service.getSite('douban')).toEqual(
      expect.objectContaining({
        authPolicy: 'required',
        loginUrl: 'https://accounts.douban.com/passport/login',
        profileName: 'douban-main',
        siteId: 'douban',
      }),
    );
    expect(
      service.resolveForUrl('https://movie.douban.com/subject/1/'),
    ).toEqual(expect.objectContaining({ siteId: 'douban' }));
  });

  it('merges a JSON override over built-in sites', async () => {
    await withBrowserSitesFile(
      {
        version: 1,
        sites: [
          {
            allowedOrigins: ['https://douban.example'],
            authPolicy: 'required',
            displayName: 'Douban Local',
            siteId: 'douban',
          },
        ],
      },
      async (sitesFilePath) => {
        const service = await SitesConfigService.create({
          sitesFilePath,
        });

        expect(service.getSite('douban')).toEqual(
          expect.objectContaining({
            allowedOrigins: ['https://douban.example'],
            displayName: 'Douban Local',
            loginUrl: 'https://accounts.douban.com/passport/login',
            profileName: 'douban-main',
          }),
        );
      },
    );
  });

  it('adds new JSON sites', async () => {
    await withBrowserSitesFile(
      {
        version: 1,
        sites: [
          {
            allowedOrigins: ['https://example.com'],
            authPolicy: 'anonymous',
            displayName: 'Example',
            siteId: 'example',
          },
        ],
      },
      async (sitesFilePath) => {
        const service = await SitesConfigService.create({
          sitesFilePath,
        });

        expect(service.resolveForUrl('https://example.com/page')).toEqual(
          expect.objectContaining({
            authPolicy: 'anonymous',
            siteId: 'example',
          }),
        );
      },
    );
  });

  it('fails when an explicit JSON override is invalid', async () => {
    await withRawFile('{', async (sitesFilePath) => {
      await expect(
        SitesConfigService.create({ sitesFilePath }),
      ).rejects.toThrow(ConfigError);
    });
  });

  it('returns copies of effective sites', async () => {
    const service = await SitesConfigService.create();
    const [site] = service.listSites();
    if (!site) {
      throw new Error('expected at least one site');
    }

    (site.allowedOrigins as string[]).push('https://mutated.example');

    expect(service.getSite(site.siteId)?.allowedOrigins).not.toContain(
      'https://mutated.example',
    );
  });
});

async function withBrowserSitesFile(
  value: unknown,
  callback: (path: string) => Promise<void>,
): Promise<void> {
  await withRawFile(JSON.stringify(value), callback);
}

async function withRawFile(
  raw: string,
  callback: (path: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'cthutool-backend-sites-'));
  try {
    const path = join(dir, 'browser-sites.json');
    await writeFile(path, raw, 'utf8');
    await callback(path);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
}
