import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  fetchBrowserStatus,
  fetchDoubanMovieInfo,
} from '../../src/renderer/src/agents-api';

describe('agents api browser status', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('does not fetch removed browser compatibility APIs', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    const status = await fetchBrowserStatus('http://backend.local:3000/');

    expect(fetch).not.toHaveBeenCalled();
    expect(status).toEqual({ profiles: [], sites: [] });
  });

  test('loads Douban movie info through the lookup API', async () => {
    const fetch = vi.fn(async () => ({
      json: async () => ({
        movie: {
          aliases: [],
          capturedAt: '2026-06-15T10:00:00.000Z',
          casts: [],
          countries: [],
          directors: [],
          finalUrl: 'https://movie.douban.com/subject/1292052/',
          genres: ['剧情'],
          languages: [],
          releaseDates: [],
          sourceUrl: 'https://movie.douban.com/subject/1292052/',
          subjectId: '1292052',
          title: '肖申克的救赎',
          writers: [],
        },
      }),
      ok: true,
    }));
    vi.stubGlobal('fetch', fetch);

    const movie = await fetchDoubanMovieInfo(
      'http://backend.local:3000/',
      'https://movie.douban.com/subject/1292052/',
    );

    expect(fetch).toHaveBeenCalledWith(
      'http://backend.local:3000/api/douban/movies?input=https%3A%2F%2Fmovie.douban.com%2Fsubject%2F1292052%2F',
    );
    expect(movie.title).toBe('肖申克的救赎');
  });

  test('surfaces backend Douban lookup errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({
          code: 'AUTH_REQUIRED',
          message: 'Login required',
        }),
        ok: false,
        status: 401,
      })),
    );

    await expect(
      fetchDoubanMovieInfo('http://backend.local:3000', '1292052'),
    ).rejects.toThrow('Login required');
  });
});
