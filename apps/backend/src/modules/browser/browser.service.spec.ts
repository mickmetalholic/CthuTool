import { BrowserService } from './browser.service';

describe('BrowserService', () => {
  it('delegates browser content and status calls to shared services', async () => {
    const { service, content, auth, runtime } = createHarness();
    const request = {
      url: 'https://movie.douban.com/subject/1292052/',
      siteId: 'douban',
      authPolicy: 'required' as const,
    };

    await expect(service.getPageContent(request)).resolves.toEqual({
      text: 'The Shawshank Redemption',
      url: request.url,
    });
    await expect(service.getAuthStatus('douban', 'main')).resolves.toEqual({
      status: 'verified',
    });
    await expect(service.getRuntimeStatus()).resolves.toEqual({
      available: true,
    });
    await expect(service.getDiagnostics()).resolves.toEqual({
      agentId: 'agent-1',
      online: true,
      capabilities: ['browser'],
    });

    expect(content.getPageContent).toHaveBeenCalledWith(request);
    expect(auth.getAuthStatus).toHaveBeenCalledWith('douban', 'main');
    expect(auth.getRuntimeStatus).toHaveBeenCalledWith();
    expect(runtime.getDiagnostics).toHaveBeenCalledWith();
  });

  it('delegates browser profile operations to the desktop runtime', async () => {
    const { service, runtime } = createHarness();

    await expect(
      service.openLogin({
        siteId: 'douban',
        profileName: 'main',
        loginUrl: 'https://accounts.douban.com/passport/login',
        timeoutMs: 12_000,
      }),
    ).resolves.toEqual({
      ok: true,
      value: { profileName: 'main', status: 'available' },
    });
    await expect(
      service.verifyProfile({
        siteId: 'douban',
        profileName: 'main',
        verifyUrl: 'https://movie.douban.com/',
        timeoutMs: 8_000,
      }),
    ).resolves.toEqual({
      ok: true,
      value: { profileName: 'main', status: 'available' },
    });

    expect(runtime.openLogin).toHaveBeenCalledWith({
      siteId: 'douban',
      profileName: 'main',
      loginUrl: 'https://accounts.douban.com/passport/login',
      timeoutMs: 12_000,
    });
    expect(runtime.verifyProfile).toHaveBeenCalledWith({
      siteId: 'douban',
      profileName: 'main',
      verifyUrl: 'https://movie.douban.com/',
      timeoutMs: 8_000,
    });
  });
});

function createHarness() {
  const content = {
    getPageContent: vi.fn(async () => ({
      text: 'The Shawshank Redemption',
      url: 'https://movie.douban.com/subject/1292052/',
    })),
  };
  const auth = {
    getAuthStatus: vi.fn(async () => ({ status: 'verified' })),
    getRuntimeStatus: vi.fn(async () => ({ available: true })),
  };
  const runtime = {
    getDiagnostics: vi.fn(async () => ({
      agentId: 'agent-1',
      online: true,
      capabilities: ['browser'],
    })),
    openLogin: vi.fn(async () => ({
      ok: true,
      value: { profileName: 'main', status: 'available' },
    })),
    verifyProfile: vi.fn(async () => ({
      ok: true,
      value: { profileName: 'main', status: 'available' },
    })),
  };

  return {
    auth,
    content,
    runtime,
    service: new BrowserService(
      content as never,
      auth as never,
      runtime as never,
    ),
  };
}
