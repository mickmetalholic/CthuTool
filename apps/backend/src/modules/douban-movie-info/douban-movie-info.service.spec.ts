import type { Mock } from 'vitest';
import type { BrowserContentService } from '../browser/content/browser-content.service';
import { BrowserAutomationError } from '../browser-automation/browser-automation.errors';
import type { BrowserContentResult } from '../browser-automation/browser-automation.types';
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
      suppressPendingAuthTask: true,
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
        throw new BrowserAutomationError(
          'AGENT_NOT_AVAILABLE',
          'No browser agent',
        );
      }),
    } as unknown as BrowserContentService & {
      getPageContent: Mock;
    };
    const service = createService(browserContent);

    await expect(service.getMovie('1292052')).rejects.toMatchObject({
      code: 'BROWSER_UNAVAILABLE',
    });
  });

  it('emits observable success and failure events', async () => {
    const observability = { record: vi.fn() };
    const service = createService(createBrowserContent(), observability);

    await service.getMovie('1292052');

    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'douban_movie.lookup_completed',
        details: expect.objectContaining({ subjectId: '1292052' }),
      }),
    );

    const failing = createService(
      createBrowserContent({ detection: { kind: 'rate_limited' } }),
      observability,
    );
    await expect(failing.getMovie('1292052')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'douban_movie.lookup_failed',
        details: expect.objectContaining({ subjectId: '1292052' }),
      }),
    );
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
): BrowserContentService & { getPageContent: Mock } {
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
  } as unknown as BrowserContentService & { getPageContent: Mock };
}

function createService(
  browserContent: BrowserContentService & { getPageContent: Mock },
  observability?: { readonly record: Mock },
): DoubanMovieInfoService {
  return new DoubanMovieInfoService(browserContent, observability as never);
}
