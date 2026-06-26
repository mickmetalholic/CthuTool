import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RootLayout, { metadata } from '../src/app/layout';
import Home from '../src/app/page';

describe('web project shell', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the management console scaffold headline', async () => {
    global.fetch = vi.fn(async () =>
      Response.json(
        {
          service: 'backend',
          status: 'ok',
          timestamp: '2026-06-24T00:00:00.000Z',
        },
        { status: 200 },
      ),
    ) as typeof fetch;

    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('CthuTool Web');
    expect(html).toContain('Management console scaffold');
    expect(html).toContain('Backend status: ok');
    expect(html).toContain('min-h-screen');
  });

  it('exposes stable page metadata for the shell route', () => {
    expect(metadata).toMatchObject({
      description: 'Browser host scaffold for the CthuTool management console.',
      title: 'CthuTool Web',
    });
  });

  it('wraps route content in the English root document', () => {
    const html = renderToStaticMarkup(
      createElement(
        RootLayout,
        null,
        createElement('main', { id: 'content' }, 'Route content'),
      ),
    );

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<main id="content">Route content</main>');
  });
});
