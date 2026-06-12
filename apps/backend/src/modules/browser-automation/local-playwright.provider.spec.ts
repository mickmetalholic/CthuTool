import { chromium } from 'playwright';
import { LocalPlaywrightProvider } from './local-playwright.provider';

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

describe('LocalPlaywrightProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures page content and closes browser resources', async () => {
    const browser = mockBrowser();
    jest.mocked(chromium.launch).mockResolvedValue(browser as never);
    const provider = new LocalPlaywrightProvider({
      dataDir: './tmp/browser',
      headless: true,
    });

    const result = await provider.capturePage({
      url: 'https://movie.douban.com/subject/1/',
      allowedOrigins: ['https://movie.douban.com'],
      includeHtml: true,
      includeText: true,
      timeoutMs: 1234,
      waitUntil: 'load',
    });

    expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
    expect(browser.newContext).toHaveBeenCalledWith({});
    expect(browser.page.goto).toHaveBeenCalledWith(
      'https://movie.douban.com/subject/1/',
      {
        timeout: 1234,
        waitUntil: 'load',
      },
    );
    expect(result).toEqual({
      finalUrl: 'https://movie.douban.com/subject/1/',
      status: 200,
      title: 'Movie',
      html: '<html>Movie</html>',
      text: 'Movie body',
    });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it('applies resource blocking', async () => {
    const browser = mockBrowser();
    jest.mocked(chromium.launch).mockResolvedValue(browser as never);
    const provider = new LocalPlaywrightProvider();

    await provider.capturePage({
      url: 'https://movie.douban.com/subject/1/',
      allowedOrigins: ['https://movie.douban.com'],
      blockResources: ['image'],
    });

    expect(browser.context.route).toHaveBeenCalledWith(
      '**/*',
      expect.any(Function),
    );
    const routeHandler = browser.context.route.mock.calls[0][1];
    const imageRoute = mockRoute('image');
    const scriptRoute = mockRoute('script');

    await routeHandler(imageRoute);
    await routeHandler(scriptRoute);

    expect(imageRoute.abort).toHaveBeenCalledTimes(1);
    expect(scriptRoute.continue).toHaveBeenCalledTimes(1);
  });

  it('closes browser resources when navigation throws', async () => {
    const browser = mockBrowser();
    browser.page.goto.mockRejectedValue(new Error('navigation failed'));
    jest.mocked(chromium.launch).mockResolvedValue(browser as never);
    const provider = new LocalPlaywrightProvider();

    await expect(
      provider.capturePage({
        url: 'https://movie.douban.com/subject/1/',
        allowedOrigins: ['https://movie.douban.com'],
      }),
    ).rejects.toThrow('navigation failed');
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});

function mockBrowser() {
  const page = {
    content: jest.fn(async () => '<html>Movie</html>'),
    goto: jest.fn(async () => ({ status: () => 200 })),
    locator: jest.fn(() => ({
      textContent: jest.fn(async () => 'Movie body'),
    })),
    screenshot: jest.fn(async () => Buffer.from('image')),
    title: jest.fn(async () => 'Movie'),
    url: jest.fn(() => 'https://movie.douban.com/subject/1/'),
  };
  const context = {
    newPage: jest.fn(async () => page),
    route: jest.fn(),
  };
  return {
    close: jest.fn(async () => undefined),
    context,
    newContext: jest.fn(async () => context),
    page,
  };
}

function mockRoute(resourceType: string) {
  return {
    abort: jest.fn(async () => undefined),
    continue: jest.fn(async () => undefined),
    request: jest.fn(() => ({ resourceType: () => resourceType })),
  };
}
