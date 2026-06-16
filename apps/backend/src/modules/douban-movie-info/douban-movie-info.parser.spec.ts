import { DoubanMovieInfoException } from './douban-movie-info.errors';
import { parseDoubanMovieInfo } from './douban-movie-info.parser';

const baseInput = {
  capturedAt: '2026-06-15T10:00:00.000Z',
  finalUrl: 'https://movie.douban.com/subject/1292052/',
  sourceUrl: 'https://movie.douban.com/subject/1292052/',
  subjectId: '1292052',
};

describe('parseDoubanMovieInfo', () => {
  it('prefers JSON-LD and fills selector and info-panel fields', () => {
    const movie = parseDoubanMovieInfo({
      ...baseInput,
      html: representativeHtml(),
    });

    expect(movie).toEqual(
      expect.objectContaining({
        aliases: ['月黑高飞', '刺激1995'],
        imdbId: 'tt0111161',
        posterUrl: 'https://img.example/poster.webp',
        rating: 9.7,
        ratingCount: 3295591,
        runtime: '142分钟',
        runtimeMinutes: 142,
        subjectId: '1292052',
        summary: 'Two imprisoned men bond over a number of years.',
        title: '肖申克的救赎 The Shawshank Redemption',
        year: 1994,
      }),
    );
    expect(movie.directors).toEqual([
      { name: 'Frank Darabont', url: 'https://movie.douban.com/celebrity/1/' },
    ]);
    expect(movie.writers.map((person) => person.name)).toEqual([
      'Stephen King',
    ]);
    expect(movie.casts.map((person) => person.name)).toEqual([
      'Tim Robbins',
      'Morgan Freeman',
    ]);
    expect(movie.genres).toEqual(['剧情', '犯罪']);
    expect(movie.countries).toEqual(['美国']);
    expect(movie.languages).toEqual(['英语']);
    expect(movie.releaseDates).toContain('1994-09-10');
  });

  it('uses selector fallback when JSON-LD is absent', () => {
    const movie = parseDoubanMovieInfo({
      ...baseInput,
      html: selectorFallbackHtml(),
    });

    expect(movie.title).toBe('示例电影 Example Movie');
    expect(movie.year).toBe(2001);
    expect(movie.rating).toBe(8.3);
    expect(movie.ratingCount).toBe(12345);
    expect(movie.directors).toEqual([{ name: 'Meta Director' }]);
    expect(movie.casts).toEqual([{ name: 'Meta Actor' }]);
    expect(movie.summary).toBe('OG summary');
    expect(movie.posterUrl).toBe('https://img.example/og.webp');
  });

  it('recovers mixed #info markup aliases and IMDb id', () => {
    const movie = parseDoubanMovieInfo({
      ...baseInput,
      html: infoFallbackHtml(),
    });

    expect(movie.directors).toEqual([{ name: 'Info Director' }]);
    expect(movie.writers).toEqual([{ name: 'Writer A' }, { name: 'Writer B' }]);
    expect(movie.casts).toEqual([{ name: 'Actor A' }, { name: 'Actor B' }]);
    expect(movie.aliases).toEqual(['Alias A', 'Alias B']);
    expect(movie.imdbId).toBe('tt1234567');
  });

  it('allows missing optional fields', () => {
    const movie = parseDoubanMovieInfo({
      ...baseInput,
      html: '<html><h1>独立电影 (2020)</h1><div id="info">类型: 剧情</div></html>',
    });

    expect(movie.title).toBe('独立电影');
    expect(movie.rating).toBeUndefined();
    expect(movie.posterUrl).toBeUndefined();
    expect(movie.genres).toEqual(['剧情']);
  });

  it('returns a structured parse failure for unsupported pages', () => {
    expect(() =>
      parseDoubanMovieInfo({
        ...baseInput,
        html: '<html><body>not a movie</body></html>',
      }),
    ).toThrow(DoubanMovieInfoException);
  });
});

function representativeHtml(): string {
  return `
    <html>
      <head>
        <meta property="og:title" content="fallback title" />
        <meta property="og:image" content="https://img.example/og.webp" />
        <meta property="og:description" content="fallback summary" />
        <meta property="video:actor" content="Tim Robbins" />
        <meta property="video:director" content="Frank Darabont" />
        <meta property="video:duration" content="PT2H22M" />
        <script type="application/ld+json">
          {
            "@type": "Movie",
            "name": "肖申克的救赎 The Shawshank Redemption",
            "url": "https://movie.douban.com/subject/1292052/",
            "image": "https://img.example/poster.webp",
            "director": {"name": "Frank Darabont", "url": "https://movie.douban.com/celebrity/1/"},
            "author": [{"name": "Stephen King"}],
            "actor": [{"name": "Tim Robbins"}, {"name": "Morgan Freeman"}],
            "datePublished": "1994-09-10",
            "genre": ["剧情", "犯罪"],
            "duration": "PT2H22M",
            "description": "Two imprisoned men bond over a number of years.",
            "aggregateRating": {"ratingValue": "9.7", "ratingCount": "3295591"}
          }
        </script>
      </head>
      <body>
        <div id="mainpic"><img src="https://img.example/mainpic.webp" /></div>
        <h1>肖申克的救赎 The Shawshank Redemption <span class="year">(1994)</span></h1>
        <strong property="v:average">9.6</strong>
        <span property="v:votes">3000000</span>
        <span property="v:summary">micro summary</span>
        <span property="v:genre">剧情</span>
        <span property="v:initialReleaseDate">1994-10-14(美国)</span>
        <span property="v:runtime">142分钟</span>
        <div id="info">
          <span><span class="pl">导演</span>: <a>Frank Darabont</a></span><br>
          <span><span class="pl">编剧</span>: <a>Stephen King</a></span><br>
          类型: 剧情 / 犯罪<br>
          制片国家/地区: 美国<br>
          语言: 英语<br>
          上映日期: 1994-09-10(多伦多电影节)<br>
          片长: 142分钟<br>
          又名: 月黑高飞 / 刺激1995<br>
          IMDb: tt0111161
        </div>
      </body>
    </html>`;
}

function selectorFallbackHtml(): string {
  return `
    <html>
      <head>
        <meta property="og:title" content="示例电影 Example Movie (2001)" />
        <meta property="og:image" content="https://img.example/og.webp" />
        <meta property="og:description" content="OG summary" />
        <meta property="video:actor" content="Meta Actor" />
        <meta property="video:director" content="Meta Director" />
      </head>
      <body>
        <h1>示例电影 Example Movie <span class="year">(2001)</span></h1>
        <strong property="v:average">8.3</strong>
        <span property="v:votes">12,345</span>
        <span property="v:summary">micro summary</span>
        <div id="mainpic"><img src="https://img.example/mainpic.webp" /></div>
        <div id="info">类型: 科幻</div>
      </body>
    </html>`;
}

function infoFallbackHtml(): string {
  return `
    <html>
      <body>
        <h1>信息电影 Info Movie <span class="year">(2010)</span></h1>
        <div id="info">
          <span><span class="pl">导演</span>: <a>Info Director</a></span><br>
          <span><span class="pl">编剧</span>: <a>Writer A</a> / <a>Writer B</a></span><br>
          <span><span class="pl">主演</span>: <a>Actor A</a> / <a>Actor B</a></span><br>
          类型: 剧情<br>
          又名: Alias A / Alias B<br>
          IMDb: tt1234567
        </div>
      </body>
    </html>`;
}
