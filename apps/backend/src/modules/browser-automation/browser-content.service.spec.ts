import { SitesConfigService } from '../sites-config/sites-config.service';
import type {
  BrowserContentRequest,
  BrowserProvider,
  BrowserProviderSnapshot,
} from './browser-automation.types';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';

describe('BrowserContentService', () => {
  it('rejects a URL outside the request allowed origins before navigation', async () => {
    const provider = createProvider();
    const service = createService(provider);

    await expect(
      service.getPageContent({
        url: 'https://evil.example/page',
        allowedOrigins: ['https://movie.douban.com'],
        includeHtml: true,
      }),
    ).rejects.toMatchObject({ code: 'ORIGIN_NOT_ALLOWED' });
    expect(provider.capturePage).not.toHaveBeenCalled();
  });

  it('passes required auth policy to the browser provider', async () => {
    const provider = createProvider();
    const service = createService(provider);

    await service.getPageContent({
      url: 'https://movie.douban.com/subject/1/',
      allowedOrigins: ['https://movie.douban.com'],
      profileName: 'douban',
      requireAuth: true,
    });

    expect(provider.capturePage).toHaveBeenCalledWith(
      expect.objectContaining({
        authPolicy: 'required',
        profileName: 'douban',
      }),
    );
  });

  it('falls back to anonymous navigation when optional auth is missing', async () => {
    const provider = createProvider({
      finalUrl: 'https://movie.douban.com/subject/1/',
      status: 200,
      title: 'Movie',
      html: '<html><title>Movie</title></html>',
      text: 'Movie page',
    });
    const service = createService(provider);

    const result = await service.getPageContent({
      url: 'https://movie.douban.com/subject/1/',
      allowedOrigins: ['https://movie.douban.com'],
      profileName: 'douban',
      requireAuth: false,
      includeHtml: true,
      includeText: true,
    });

    expect(result.auth).toEqual({
      profileName: 'douban',
      status: 'missing',
      used: false,
    });
    expect(result.detection.kind).toBe('ok');
    expect(provider.capturePage).toHaveBeenCalledWith(
      expect.objectContaining({ authPolicy: 'anonymous' }),
    );
  });

  it('returns content snapshot without exposing browser profile internals', async () => {
    const provider = createProvider({
      finalUrl: 'https://movie.douban.com/subject/1/',
      status: 200,
      title: 'Movie',
      html: '<html>Movie</html>',
      text: 'Movie page',
    });
    const service = createService(provider);

    const result = await service.getPageContent({
      url: 'https://movie.douban.com/subject/1/',
      allowedOrigins: ['https://movie.douban.com'],
      profileName: 'douban',
      requireAuth: true,
      includeHtml: true,
      includeText: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        finalUrl: 'https://movie.douban.com/subject/1/',
        status: 200,
        title: 'Movie',
        html: '<html>Movie</html>',
        text: 'Movie page',
        auth: {
          profileName: 'douban',
          status: 'available',
          used: true,
        },
      }),
    );
    expect(JSON.stringify(result)).not.toContain('cookie-value');
  });

  it('can resolve a site configuration from siteId', async () => {
    const provider = createProvider({
      finalUrl: 'https://movie.douban.com/subject/1/',
      status: 200,
      title: 'Movie',
    });
    const service = createService(provider);

    await service.getPageContent({
      includeHtml: true,
      siteId: 'douban',
      url: 'https://movie.douban.com/subject/1/',
    });

    expect(provider.capturePage).toHaveBeenCalledWith(
      expect.objectContaining({
        authPolicy: 'required',
        loginUrl: 'https://accounts.douban.com/passport/login',
        profileName: 'douban-main',
        siteId: 'douban',
      }),
    );
  });

  it('rejects an unknown site before navigation', async () => {
    const provider = createProvider();
    const service = createService(provider);

    await expect(
      service.getPageContent({
        includeHtml: true,
        url: 'https://unknown.example/page',
      }),
    ).rejects.toMatchObject({ code: 'SITE_NOT_CONFIGURED' });
    expect(provider.capturePage).not.toHaveBeenCalled();
  });
});

function createService(provider: BrowserProvider): BrowserContentService {
  return new BrowserContentService(
    provider,
    new SitesConfigService(),
    new BrowserTaskRunner({
      defaultDelayMs: 0,
      defaultTimeoutMs: 1000,
      maxConcurrency: 1,
    }),
    new BrowserBlockDetector(),
    new BrowserDiagnosticsStore({
      diagnosticsDir: './tmp/diagnostics',
      enabled: false,
    }),
  );
}

function createProvider(
  snapshot: BrowserProviderSnapshot = {
    finalUrl: 'https://example.com',
    status: 200,
    title: 'Example',
  },
): BrowserProvider & { capturePage: jest.Mock } {
  return {
    capturePage: jest.fn(
      async (
        _request: BrowserContentRequest,
      ): Promise<BrowserProviderSnapshot> => snapshot,
    ),
  };
}
