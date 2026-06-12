import type {
  BrowserContentRequest,
  BrowserProvider,
  BrowserProviderSnapshot,
  BrowserStorageState,
} from './browser-automation.types';
import { BrowserAuthStateStore } from './browser-auth-state.store';
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

  it('fails before navigation when auth is required but the profile is missing', async () => {
    const provider = createProvider();
    const service = createService(provider);

    await expect(
      service.getPageContent({
        url: 'https://movie.douban.com/subject/1/',
        allowedOrigins: ['https://movie.douban.com'],
        profileName: 'douban',
        requireAuth: true,
      }),
    ).rejects.toMatchObject({ code: 'AUTH_STATE_MISSING' });
    expect(provider.capturePage).not.toHaveBeenCalled();
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
      expect.objectContaining({
        storageState: undefined,
      }),
    );
  });

  it('returns content snapshot without exposing raw auth state', async () => {
    const authStore = new MemoryAuthStateStore({
      douban: {
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
    const provider = createProvider({
      finalUrl: 'https://movie.douban.com/subject/1/',
      status: 200,
      title: 'Movie',
      html: '<html>Movie</html>',
      text: 'Movie page',
    });
    const service = createService(provider, authStore);

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
});

function createService(
  provider: BrowserProvider,
  authStore: BrowserAuthStateStore = new MemoryAuthStateStore(),
): BrowserContentService {
  return new BrowserContentService(
    provider,
    authStore,
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
      async (_request: BrowserContentRequest): Promise<BrowserProviderSnapshot> =>
        snapshot,
    ),
  };
}

class MemoryAuthStateStore extends BrowserAuthStateStore {
  constructor(
    private readonly profiles: Record<string, BrowserStorageState> = {},
  ) {
    super({ authStateDir: './tmp/auth' });
  }

  override async hasProfile(profileName: string): Promise<boolean> {
    return profileName in this.profiles;
  }

  override async readStorageState(
    profileName: string,
  ): Promise<BrowserStorageState> {
    return this.profiles[profileName];
  }
}
