import { DoubanMovieInfoController } from './douban-movie-info.controller';
import type { DoubanMovieInfoService } from './douban-movie-info.service';

describe('DoubanMovieInfoController', () => {
  it('supports path id lookups', async () => {
    const service = createService();
    const controller = new DoubanMovieInfoController(service);

    await controller.getMovie('1292052');

    expect(service.getMovie).toHaveBeenCalledWith('1292052');
  });

  it('supports query input lookups for URLs', async () => {
    const service = createService();
    const controller = new DoubanMovieInfoController(service);

    await controller.lookupMovie('https://movie.douban.com/subject/1292052/');

    expect(service.getMovie).toHaveBeenCalledWith(
      'https://movie.douban.com/subject/1292052/',
    );
  });
});

function createService(): DoubanMovieInfoService & { getMovie: jest.Mock } {
  return {
    getMovie: jest.fn(async () => ({
      movie: {
        aliases: [],
        capturedAt: '2026-06-15T10:00:00.000Z',
        casts: [],
        countries: [],
        directors: [],
        finalUrl: 'https://movie.douban.com/subject/1292052/',
        genres: [],
        languages: [],
        releaseDates: [],
        sourceUrl: 'https://movie.douban.com/subject/1292052/',
        subjectId: '1292052',
        title: 'Movie',
        writers: [],
      },
    })),
  } as unknown as DoubanMovieInfoService & { getMovie: jest.Mock };
}
