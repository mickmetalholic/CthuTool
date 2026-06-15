import { BrowserBlockDetector } from './browser-block-detector';

describe('BrowserBlockDetector', () => {
  const detector = new BrowserBlockDetector();

  it('detects rate limiting by status code', () => {
    expect(
      detector.detect({
        finalUrl: 'https://movie.douban.com/',
        status: 429,
        title: 'Too Many Requests',
        text: 'slow down',
      }),
    ).toEqual({
      kind: 'rate_limited',
      reason: 'HTTP 429 indicates rate limiting',
    });
  });

  it('detects login-required pages by URL and text', () => {
    expect(
      detector.detect({
        finalUrl: 'https://accounts.douban.com/passport/login',
        status: 200,
        title: 'Login',
        text: 'Please sign in',
      }),
    ).toEqual({
      kind: 'login_required',
      reason: 'Final URL or page content indicates login is required',
    });
  });

  it('detects captcha pages without solving them', () => {
    expect(
      detector.detect({
        finalUrl: 'https://movie.douban.com/',
        status: 200,
        title: '验证',
        text: '请完成验证码后继续访问',
      }),
    ).toEqual({
      kind: 'captcha_required',
      reason: 'Page content indicates captcha or abnormal access verification',
    });
  });

  it('returns ok for normal pages', () => {
    expect(
      detector.detect({
        finalUrl: 'https://movie.douban.com/subject/1/',
        status: 200,
        title: 'Movie',
        text: 'A normal movie page',
      }),
    ).toEqual({ kind: 'ok' });
  });

  it('does not treat a normal Douban movie page login link as login required', () => {
    expect(
      detector.detect({
        finalUrl: 'https://movie.douban.com/subject/1292052/',
        status: 200,
        title: '肖申克的救赎',
        text: '肖申克的救赎 The Shawshank Redemption 登录 注册 9.7 剧情 犯罪',
      }),
    ).toEqual({ kind: 'ok' });
  });

  it('does not treat dormant Douban login redirects in movie page scripts as login required', () => {
    expect(
      detector.detect({
        finalUrl: 'https://movie.douban.com/subject/1292052/',
        status: 200,
        title: '肖申克的救赎',
        text: [
          '肖申克的救赎 The Shawshank Redemption',
          "if(sort === 'follow' && false){",
          "window.location.href = '//www.douban.com/accounts/login?source=movie';",
          '}',
        ].join('\n'),
      }),
    ).toEqual({ kind: 'ok' });
  });
});
