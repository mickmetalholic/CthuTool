import type { Mock } from 'vitest';
import type { BrowserService } from '../browser/browser.service';
import { BrowserWorkflowError } from '../browser/shared/browser.errors';
import type { BrowserContentResult } from '../browser/shared/browser.types';
import { DoubanMovieInfoException } from './douban-movie-info.errors';
import { DoubanMovieInfoService } from './douban-movie-info.service';

describe('DoubanMovieInfoService', () => {
  it('normalizes URL input and requests browser content with Douban site config', async () => {
    const browserContent = createBrowserContent();
    const service = createService(browserContent);

    const result = await service.getMovie(
      'https://movie.douban.com/subject/1292052/',
    );

    expect(result.movie.subjectId).toBe('1292052');
    expect(browserContent.getPageContent).toHaveBeenCalledWith({
      includeHtml: true,
      includeScreenshot: false,
      includeText: true,
      siteId: 'douban',
      url: 'https://movie.douban.com/subject/1292052/',
      waitUntil: 'domcontentloaded',
    });
  });

  it('rejects invalid input before browser dispatch', async () => {
    const browserContent = createBrowserContent();
    const service = createService(browserContent);

    await expect(service.getMovie('bad-input')).rejects.toMatchObject({
      code: 'INVALID_SUBJECT_ID',
    });
    expect(browserContent.getPageContent).not.toHaveBeenCalled();
  });

  it('maps browser detection errors into Douban errors', async () => {
    const service = createService(
      createBrowserContent({
        detection: { kind: 'captcha_required' },
      }),
    );

    await expect(service.getMovie('1292052')).rejects.toMatchObject({
      code: 'CAPTCHA_REQUIRED',
    });
  });

  it('maps browser provider errors into Douban errors', async () => {
    const browserContent = {
      getPageContent: vi.fn(async () => {
        throw new BrowserWorkflowError(
          'AGENT_NOT_AVAILABLE',
          'No browser agent',
        );
      }),
    } as unknown as BrowserService & {
      getPageContent: Mock;
    };
    const service = createService(browserContent);

    await expect(service.getMovie('1292052')).rejects.toMatchObject({
      code: 'BROWSER_UNAVAILABLE',
    });
  });

  it('returns not found for a missing subject snapshot', async () => {
    const service = createService(
      createBrowserContent({
        status: 404,
      }),
    );

    await expect(service.getMovie('1292052')).rejects.toThrow(
      DoubanMovieInfoException,
    );
    await expect(service.getMovie('1292052')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

function createBrowserContent(
  patch: Partial<BrowserContentResult> = {},
): BrowserService & { getPageContent: Mock } {
  return {
    getPageContent: vi.fn(
      async (): Promise<BrowserContentResult> => ({
        auth: { profileName: 'douban-main', status: 'available', used: true },
        capturedAt: '2026-06-15T10:00:00.000Z',
        detection: { kind: 'ok' },
        finalUrl: 'https://movie.douban.com/subject/1292052/',
        html: '<html><h1>肖申克的救赎 <span class="year">(1994)</span></h1><div id="info">类型: 剧情</div></html>',
        status: 200,
        text: 'movie',
        title: '肖申克的救赎',
        ...patch,
      }),
    ),
  } as unknown as BrowserService & { getPageContent: Mock };
}

function createService(
  browserContent: BrowserService & { getPageContent: Mock },
): DoubanMovieInfoService {
  return new DoubanMovieInfoService(browserContent);
}
