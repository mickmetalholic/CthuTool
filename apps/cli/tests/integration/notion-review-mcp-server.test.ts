/// <reference lib="dom" />

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { type Browser, chromium, type Page } from 'playwright';

const plugin = new URL(
  '../../../../codex/plugins/cthu-codex/',
  import.meta.url,
);
const serverPath = fileURLToPath(
  new URL('scripts/notion-review-mcp-server.mjs', plugin),
);
const htmlPath = new URL('ui/notion-review/v1.html', plugin);
const toolName = 'cthu_notion_review_present';
const resourceUri = 'ui://cthu-notion-review/v1.html';
const browserExecutable =
  process.env.CTHUTOOL_PLAYWRIGHT_EXECUTABLE ?? chromium.executablePath();
const describeBrowser = existsSync(browserExecutable)
  ? describe
  : describe.skip;

const regular = {
  id: '324f0000-abcd-9012-aaaa-00a000000001',
  title: 'Japanese grammar',
  url: 'https://app.notion.com/p/324f0000abcd9012aaaa00a000000001',
  categories: ['Japanese'],
  stage: 0,
  status: 'Learning',
  lastReviewed: '2026-10-12',
};
const promotion = {
  ...regular,
  id: '324f0000-abcd-9012-aaaa-00a000000002',
  url: 'https://app.notion.com/p/324f0000abcd9012aaaa00a000000002',
  title: 'Grammar recap',
  stage: 5,
};
const longTerm = {
  ...regular,
  id: '324f0000-abcd-9012-aaaa-00a000000003',
  url: 'https://www.notion.so/Long-term-324f0000abcd9012aaaa00a000000003',
  title: 'Long-term reading',
  categories: ['Reading'],
  stage: 6,
};

function request(id: number, method: string, params?: unknown) {
  return { jsonrpc: '2.0', id, method, params };
}

function loadServer() {
  return import(pathToFileURL(serverPath).href);
}

describe('CthuCodex notion review MCP server', () => {
  test('stdio exposes a read-only renderer and the packaged MCP Apps resource', async () => {
    const child = Bun.spawn(['node', serverPath], {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const messages = [
      request(1, 'initialize', { protocolVersion: '2025-06-18' }),
      request(2, 'tools/list'),
      request(3, 'resources/read', { uri: resourceUri }),
      request(4, 'tools/call', {
        name: toolName,
        arguments: { notes: [regular] },
      }),
    ];
    for (const message of messages)
      child.stdin.write(`${JSON.stringify(message)}\n`);
    child.stdin.end();
    const [output, stderr, exit] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect(exit).toBe(0);
    expect(stderr).toBe('');
    const replies = output
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(replies[0].result.protocolVersion).toBe('2025-06-18');
    expect(replies[1].result.tools).toEqual([
      expect.objectContaining({
        name: toolName,
        annotations: expect.objectContaining({ readOnlyHint: true }),
        _meta: expect.objectContaining({ ui: { resourceUri } }),
      }),
    ]);
    expect(replies[2].result.contents[0]).toMatchObject({
      uri: resourceUri,
      mimeType: 'text/html;profile=mcp-app',
    });
    expect(replies[2].result.contents[0].text).toContain('ui/message');
    expect(replies[3].result.structuredContent).toEqual({
      notes: [regular],
      categories: ['Japanese'],
      partial: false,
    });
  });

  test('rejects substituted page links, duplicate IDs, and completed notes', async () => {
    const { presentNotionReview } = await loadServer();
    for (const notes of [
      [{ ...regular, url: promotion.url }],
      [
        {
          ...regular,
          url: regular.url.replace('app.notion.com', 'app.notion.com.invalid'),
        },
      ],
      [regular, regular],
      [{ ...longTerm, status: 'Archived' }],
    ]) {
      expect(presentNotionReview({ notes })).toMatchObject({ isError: true });
    }
    expect(
      presentNotionReview({ notes: [], partial: true }).structuredContent,
    ).toMatchObject({ partial: true });
  });

  test('streamable HTTP serves the same tools and rejects an untrusted origin', async () => {
    const { createReviewHttpServer } = await loadServer();
    const server = createReviewHttpServer({
      allowedOrigins: ['https://chatgpt.com'],
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    try {
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`;
      const headers = {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      };
      const post = (body: unknown, origin = 'https://chatgpt.com') =>
        fetch(url, {
          method: 'POST',
          headers: { ...headers, origin },
          body: JSON.stringify(body),
        });
      const reply = await post(request(1, 'tools/list'));
      expect(reply.status).toBe(200);
      expect(await reply.json()).toMatchObject({
        result: { tools: [expect.objectContaining({ name: toolName })] },
      });
      expect(
        (await post({ jsonrpc: '2.0', method: 'notifications/initialized' }))
          .status,
      ).toBe(202);
      expect(
        (await post(request(2, 'tools/list'), 'https://untrusted.test')).status,
      ).toBe(403);
      expect((await fetch(url)).status).toBe(405);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error?: Error) => (error ? reject(error) : resolve())),
      );
    }
  });
});

function inScript(value: unknown) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

async function renderWithHost(page: Page, input: unknown) {
  const { presentNotionReview } = await loadServer();
  const data = presentNotionReview(input).structuredContent;
  const widget = await readFile(htmlPath, 'utf8');
  await page.setContent(`
    <iframe id="review" style="border:0;width:100%;height:650px"></iframe>
    <script>
      (() => {
      const frame = document.querySelector('#review');
      window.submissions = [];
      window.addEventListener('message', ({ source, data: message }) => {
        if (source !== frame.contentWindow) return;
        const reply = result => source.postMessage({ jsonrpc: '2.0', id: message.id, result }, '*');
        if (message.method === 'ui/initialize') {
          reply({ protocolVersion: '2026-01-26', hostContext: { theme: 'light' } });
        }
        if (message.method === 'ui/notifications/initialized') {
          source.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: { structuredContent: ${inScript(data)} } }, '*');
        }
        if (message.method === 'ui/message') {
          const text = message.params.content[0].text;
          window.submissions.push(JSON.parse(text.split('复习面板提交：')[1]));
          reply({});
        }
      });
      frame.srcdoc = ${inScript(widget)};
      })();
    </script>
  `);
  return page.frameLocator('#review');
}

function submissions(page: Page) {
  return page.evaluate('window.submissions');
}

describeBrowser('Notion review panel in an MCP Apps iframe', () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await chromium.launch({ executablePath: browserExecutable });
  });
  afterAll(async () => {
    await browser?.close();
  });

  test('category and note clicks stay local until the user submits a recall result', async () => {
    const page = await browser.newPage({
      viewport: { width: 380, height: 650 },
    });
    try {
      const panel = await renderWithHost(page, { notes: [regular, longTerm] });
      await panel
        .getByRole('combobox', { name: '类别' })
        .selectOption({ label: 'Japanese（1）' });
      expect(
        await panel.getByRole('button', { name: /Long-term reading/ }).count(),
      ).toBe(0);
      await panel.getByRole('button', { name: /Japanese grammar/ }).click();
      await panel.getByRole('link', { name: '在 Notion 中打开' }).waitFor();
      expect(await panel.getByRole('link').getAttribute('href')).toBe(
        regular.url,
      );
      expect(await submissions(page)).toEqual([]);
      await panel.getByRole('button', { name: '记得', exact: true }).click();
      await panel.getByText('已提交到对话，等待 Notion 写回确认。').waitFor();
      expect(
        await panel
          .getByRole('button', { name: '记得', exact: true })
          .isEnabled(),
      ).toBe(false);
      expect(await submissions(page)).toEqual([
        {
          pageId: regular.id,
          categoryIndex: 0,
          result: 'remembered',
          snapshot: {
            status: 'Learning',
            stage: 0,
            lastReviewed: regular.lastReviewed,
          },
        },
      ]);
    } finally {
      await page.close();
    }
  });

  test('stage 5 promotion waits for a schedule choice; a stage 6 review submits that choice directly', async () => {
    const page = await browser.newPage();
    try {
      const panel = await renderWithHost(page, {
        notes: [promotion, longTerm],
        preferredCategory: 'Japanese',
      });
      await panel.getByRole('button', { name: /Grammar recap/ }).click();
      await panel.getByRole('button', { name: '记得', exact: true }).click();
      await panel.getByRole('button', { name: '90 天后再复习' }).waitFor();
      expect(await submissions(page)).toEqual([]);
      await panel.getByRole('button', { name: '90 天后再复习' }).click();
      await panel.getByText('已提交到对话，等待 Notion 写回确认。').waitFor();
      expect(await submissions(page)).toMatchObject([
        {
          pageId: promotion.id,
          result: 'remembered',
          schedule: 'review-again',
        },
      ]);

      const refreshed = await renderWithHost(page, {
        notes: [longTerm],
        preferredCategory: 'Reading',
        feedback: { kind: 'success', text: '已保存。下次复习 2027-02-21。' },
      });
      await refreshed.getByText('已保存。下次复习 2027-02-21。').waitFor();
      await refreshed
        .getByRole('button', { name: /Long-term reading/ })
        .click();
      expect(
        await refreshed
          .getByRole('button', { name: '记得', exact: true })
          .count(),
      ).toBe(0);
      await refreshed.getByRole('button', { name: '归档' }).click();
      await refreshed
        .getByText('已提交到对话，等待 Notion 写回确认。')
        .waitFor();
      expect(await submissions(page)).toEqual([
        {
          pageId: longTerm.id,
          categoryIndex: 0,
          schedule: 'archive',
          snapshot: {
            status: 'Learning',
            stage: 6,
            lastReviewed: longTerm.lastReviewed,
          },
        },
      ]);
    } finally {
      await page.close();
    }
  });
});
