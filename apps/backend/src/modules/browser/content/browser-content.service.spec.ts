import { SitesConfigService } from '../../sites-config/sites-config.service';
import type { DesktopBrowserRuntimeService } from '../desktop-runtime/desktop-browser-runtime.service';
import { BrowserBlockDetector } from './browser-block-detector';
import { BrowserContentService } from './browser-content.service';
import { BrowserDiagnosticsStore } from './browser-diagnostics.store';
import { BrowserTaskRunner } from './browser-task-runner';

describe('BrowserContentService', () => {
  it('rejects a URL outside the request allowed origins before navigation', async () => {
    const runtime = createRuntimeMock();
    const service = createService(runtime);

    await expect(
      service.getPageContent({
        url: 'https://evil.example/page',
        allowedOrigins: ['https://movie.douban.com'],
        includeHtml: true,
      }),
    ).rejects.toMatchObject({ code: 'ORIGIN_NOT_ALLOWED' });
    expect(runtime.capturePage).not.toHaveBeenCalled();
  });

  it('passes required auth policy to the browser runtime', async () => {
    const runtime = createRuntimeMock();
    const service = createService(runtime);

    await service.getPageContent({
      url: 'https://movie.douban.com/subject/1/',
      allowedOrigins: ['https://movie.douban.com'],
      profileName: 'douban',
      requireAuth: true,
    });

    expect(runtime.capturePage).toHaveBeenCalledWith(
      expect.objectContaining({
        authPolicy: 'required',
        profileName: 'douban',
      }),
    );
  });

  it('falls back to anonymous navigation when optional auth is missing', async () => {
    const runtime = createRuntimeMock({
      finalUrl: 'https://movie.douban.com/subject/1/',
      status: 200,
      title: 'Movie',
      html: '<html><title>Movie</title></html>',
      text: 'Movie page',
    });
    const service = createService(runtime);

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
    expect(runtime.capturePage).toHaveBeenCalledWith(
      expect.objectContaining({ authPolicy: 'anonymous' }),
    );
  });

  it('returns content snapshot without exposing browser profile internals', async () => {
    const runtime = createRuntimeMock({
      finalUrl: 'https://movie.douban.com/subject/1/',
      status: 200,
      title: 'Movie',
      html: '<html>Movie</html>',
      text: 'Movie page',
    });
    const service = createService(runtime);

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
    const runtime = createRuntimeMock({
      finalUrl: 'https://movie.douban.com/subject/1/',
      status: 200,
      title: 'Movie',
    });
    const service = createService(runtime);

    await service.getPageContent({
      includeHtml: true,
      siteId: 'douban',
      url: 'https://movie.douban.com/subject/1/',
    });

    expect(runtime.capturePage).toHaveBeenCalledWith(
      expect.objectContaining({
        authPolicy: 'required',
        loginUrl: 'https://accounts.douban.com/passport/login',
        profileName: 'douban-main',
        siteId: 'douban',
      }),
    );
  });

  it('rejects an unknown site before navigation', async () => {
    const runtime = createRuntimeMock();
    const service = createService(runtime);

    await expect(
      service.getPageContent({
        includeHtml: true,
        url: 'https://unknown.example/page',
      }),
    ).rejects.toMatchObject({ code: 'SITE_NOT_CONFIGURED' });
    expect(runtime.capturePage).not.toHaveBeenCalled();
  });

  it('preserves runtime interaction challenge details', async () => {
    const runtime = createRuntimeMock();
    runtime.capturePage.mockResolvedValueOnce({
      ok: false,
      challenge: {
        action: 'login',
        loginUrl: 'https://accounts.douban.com/passport/login',
        profileName: 'douban-main',
        reason: 'login_required',
        siteId: 'douban',
        verifyUrl: 'https://movie.douban.com/',
      },
    });
    const service = createService(runtime);

    await expect(
      service.getPageContent({
        includeHtml: true,
        siteId: 'douban',
        url: 'https://movie.douban.com/subject/1/',
      }),
    ).rejects.toMatchObject({
      code: 'AUTH_PROFILE_REQUIRED',
      details: {
        challenge: {
          action: 'login',
          loginUrl: 'https://accounts.douban.com/passport/login',
          profileName: 'douban-main',
          reason: 'login_required',
          siteId: 'douban',
          verifyUrl: 'https://movie.douban.com/',
        },
      },
    });
  });
});

function createService(
  runtime: Pick<DesktopBrowserRuntimeService, 'capturePage'>,
): BrowserContentService {
  return new BrowserContentService(
    runtime as DesktopBrowserRuntimeService,
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

function createRuntimeMock(snapshot?: {
  readonly finalUrl: string;
  readonly status?: number;
  readonly title?: string;
  readonly html?: string;
  readonly text?: string;
  readonly screenshotBase64?: string;
}): Pick<DesktopBrowserRuntimeService, 'capturePage'> & {
  readonly capturePage: jest.Mock;
} {
  return {
    capturePage: jest.fn(async () => {
      if (snapshot) {
        return {
          ok: true as const,
          value: {
            capturedAt: new Date().toISOString(),
            detection: { kind: 'ok' as const },
            finalUrl: snapshot.finalUrl,
            html: snapshot.html,
            screenshotBase64: snapshot.screenshotBase64,
            status: snapshot.status,
            text: snapshot.text,
            title: snapshot.title,
          },
        };
      }
      return {
        ok: true as const,
        value: {
          capturedAt: new Date().toISOString(),
          detection: { kind: 'ok' as const },
          finalUrl: 'https://example.com',
          status: 200,
          title: 'Example',
        },
      };
    }),
  };
}
