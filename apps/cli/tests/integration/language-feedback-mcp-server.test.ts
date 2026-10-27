/// <reference lib="dom" />

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type Browser,
  chromium as defaultChromium,
  type Page,
} from 'playwright';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const pluginRoot = join(repoRoot, 'codex', 'plugins', 'cthu-codex');
const serverPath = join(
  pluginRoot,
  'scripts',
  'language-feedback-mcp-server.mjs',
);
const resourcePath = join(pluginRoot, 'ui', 'language-feedback', 'v1.html');
const browserExecutablePath =
  process.env.CTHUTOOL_PLAYWRIGHT_EXECUTABLE ??
  defaultChromium.executablePath();
const describeBrowser = existsSync(browserExecutablePath)
  ? describe
  : describe.skip;

const validFeedback = {
  version: 1,
  variant: 'compact',
  original: 'Now correcting content is not obvious.',
  bestVersion: 'The corrections are not prominent enough right now.',
  notes: [
    {
      category: 'naturalness',
      message: 'Use “prominent” for something that should stand out visually.',
    },
    {
      category: 'clarity',
      message: 'Name the corrections directly instead of “content.”',
    },
  ],
} as const;

async function loadServerModule() {
  return await import(`${pathToFileURL(serverPath).href}?t=${Date.now()}`);
}

async function loadPlaywright() {
  const overridePath = process.env.CTHUTOOL_PLAYWRIGHT_MODULE;
  return overridePath
    ? await import(pathToFileURL(overridePath).href)
    : await import('playwright');
}

async function runServer(
  executablePath: string,
  messages: readonly (string | Record<string, unknown>)[],
) {
  const proc = Bun.spawn(['node', executablePath], {
    cwd: dirname(executablePath),
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });

  for (const message of messages) {
    proc.stdin.write(
      `${typeof message === 'string' ? message : JSON.stringify(message)}\n`,
    );
  }
  proc.stdin.end();

  const output = await new Response(proc.stdout).text();
  const error = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return {
    code,
    error,
    responses: output
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  };
}

describe('CthuCodex language-feedback MCP server', () => {
  test('initializes and advertises one read-only UI presentation tool', async () => {
    const result = await runServer(serverPath, [
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      { jsonrpc: '2.0', id: 3, method: 'resources/list' },
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'resources/read',
        params: { uri: 'ui://cthu-language-feedback/v1.html' },
      },
    ]);

    expect(result.code).toBe(0);
    expect(result.error).toBe('');
    expect(result.responses).toHaveLength(4);
    expect(result.responses[0].result).toMatchObject({
      protocolVersion: '2025-06-18',
      capabilities: { tools: {}, resources: {} },
      serverInfo: { name: 'cthu-codex-language-feedback' },
    });

    const tool = result.responses[1].result.tools[0];
    expect(tool.name).toBe('cthu_language_feedback_present');
    expect(tool.description).toContain(
      "before starting the user's requested task",
    );
    expect(tool.description).not.toContain('after completing');
    expect(tool.description).toContain(
      'before other task-related tool calls and the main answer',
    );
    expect(tool.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    });
    expect(tool._meta.ui.resourceUri).toBe(
      'ui://cthu-language-feedback/v1.html',
    );
    expect(tool._meta['openai/outputTemplate']).toBe(
      'ui://cthu-language-feedback/v1.html',
    );
    expect(tool.inputSchema.properties.variant.enum).toEqual(['compact']);
    expect(tool.inputSchema.properties.notes.maxItems).toBe(12);

    expect(result.responses[2].result.resources).toEqual([
      expect.objectContaining({
        uri: 'ui://cthu-language-feedback/v1.html',
        mimeType: 'text/html;profile=mcp-app',
      }),
    ]);
    const resource = result.responses[3].result.contents[0];
    expect(resource.uri).toBe('ui://cthu-language-feedback/v1.html');
    expect(resource.mimeType).toBe('text/html;profile=mcp-app');
    expect(resource._meta['openai/widgetMinFrameHeight']).toBe(0);
    expect(resource._meta.ui.csp).toEqual({
      connectDomains: [],
      resourceDomains: [],
    });
    expect(resource.text).toContain('ui/initialize');
    expect(resource.text).toContain('ui/notifications/tool-result');
    expect(resource.text).not.toMatch(
      /<(?:script|link)\b[^>]*(?:src|href)\s*=/i,
    );
    expect(resource.text).not.toMatch(/https?:\/\//i);
    expect(resource.text).not.toContain('fetch(');
    expect(resource.text).not.toContain('XMLHttpRequest');
    expect(resource.text).not.toContain('WebSocket');
  });

  test('normalizes valid feedback and returns complete structured and text content', async () => {
    const { presentLanguageFeedback } = await loadServerModule();
    const normalized = presentLanguageFeedback({
      version: 1,
      original: validFeedback.original,
      bestVersion: validFeedback.bestVersion,
      notes: validFeedback.notes,
    });

    expect(normalized.isError).toBe(false);
    expect(normalized.structuredContent).toEqual(validFeedback);
    expect(normalized.content[0].text).toContain('English feedback');
    expect(normalized.content[0].text).toContain(validFeedback.bestVersion);
    expect(normalized.content[0].text).toContain(validFeedback.original);
    expect(normalized.content[0].text).toContain('You wrote:');
    expect(normalized.content[0].text).toContain('Suggested wording:');
    expect(normalized.content[0].text).toContain(
      `Phrasing: ${validFeedback.notes[0].message}`,
    );
    expect(normalized.content[0].text).toContain(
      `Clarity: ${validFeedback.notes[1].message}`,
    );
    expect(normalized.content[0].text.indexOf('Phrasing')).toBeLessThan(
      normalized.content[0].text.indexOf('Clarity'),
    );

    const unchanged = presentLanguageFeedback({
      ...validFeedback,
      original: validFeedback.bestVersion,
      notes: [],
    });
    expect(unchanged.content[0].text).toBe(
      'English feedback\n\nYour message is grammatically correct and sounds natural.',
    );

    const optionalNotes = presentLanguageFeedback({
      ...validFeedback,
      original: validFeedback.bestVersion,
    });
    expect(optionalNotes.content[0].text).toContain('No changes needed:');
    expect(optionalNotes.content[0].text).toContain('Notes:');
    expect(optionalNotes.content[0].text).not.toContain(
      'Your message is grammatically correct and sounds natural.',
    );
  });

  test('accepts documented version 1 boundaries', async () => {
    const { presentLanguageFeedback } = await loadServerModule();
    const boundary = presentLanguageFeedback({
      version: 1,
      variant: 'compact',
      original: 'o'.repeat(8_000),
      bestVersion: 'b'.repeat(8_000),
      notes: Array.from({ length: 12 }, (_, index) => ({
        category: [
          'grammar',
          'naturalness',
          'tone',
          'idiom',
          'clarity',
          'other',
        ][index % 6],
        message: 'n'.repeat(2_000),
      })),
    });

    expect(boundary.isError).toBe(false);
    expect(boundary.structuredContent.original).toHaveLength(8_000);
    expect(boundary.structuredContent.bestVersion).toHaveLength(8_000);
    expect(boundary.structuredContent.notes).toHaveLength(12);
  });

  test('returns structured validation errors for every documented invalid shape', async () => {
    const { presentLanguageFeedback } = await loadServerModule();
    const invalidPayloads = [
      { ...validFeedback, version: 2 },
      { ...validFeedback, variant: 'diff' },
      { ...validFeedback, original: '' },
      { ...validFeedback, bestVersion: 'b'.repeat(8_001) },
      { ...validFeedback, notes: undefined },
      {
        ...validFeedback,
        notes: [{ category: 'spelling', message: 'Unsupported.' }],
      },
      {
        ...validFeedback,
        notes: Array.from({ length: 13 }, () => ({
          category: 'other',
          message: 'Too many notes.',
        })),
      },
      {
        ...validFeedback,
        notes: [{ category: 'grammar', message: 'n'.repeat(2_001) }],
      },
    ];

    for (const payload of invalidPayloads) {
      const result = presentLanguageFeedback(payload);
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        ok: false,
        error: {
          code: 'invalid_language_feedback',
        },
      });
      const issues = result.structuredContent.error.issues;
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length > 0).toBe(true);
      expect(result.content[0].text).toContain(
        "Couldn't display English feedback",
      );
    }
  });

  test('handles malformed input and unknown protocol methods, tools, and resources', async () => {
    const result = await runServer(serverPath, [
      '{not json',
      { jsonrpc: '2.0', id: 2 },
      { jsonrpc: '2.0', id: 3, method: 'unknown/method' },
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'unknown_tool', arguments: {} },
      },
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'resources/read',
        params: { uri: 'ui://unknown/view.html' },
      },
      {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'cthu_language_feedback_present',
          arguments: { version: 1 },
        },
      },
    ]);

    expect(result.responses.map((response) => response.error?.code)).toEqual([
      -32700,
      -32600,
      -32601,
      -32601,
      -32002,
      undefined,
    ]);
    expect(result.responses[5].result.isError).toBe(true);
    expect(result.responses[5].result.structuredContent.error.code).toBe(
      'invalid_language_feedback',
    );
  });

  test('reads its resource after the plugin is copied away from the repository', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'cthu-language-feedback-'));
    const copiedPlugin = join(tempRoot, 'cthu-codex');

    try {
      await cp(pluginRoot, copiedPlugin, { recursive: true });
      const copiedServer = join(
        copiedPlugin,
        'scripts',
        'language-feedback-mcp-server.mjs',
      );
      const result = await runServer(copiedServer, [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'resources/read',
          params: { uri: 'ui://cthu-language-feedback/v1.html' },
        },
      ]);

      expect(result.code).toBe(0);
      expect(result.error).toBe('');
      expect(result.responses[0].result.contents[0].text).toContain(
        '<title>English feedback</title>',
      );
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});

describeBrowser('CthuCodex language-feedback component', () => {
  let browser: Browser;
  let resourceHtml: string;

  beforeAll(async () => {
    const { chromium } = await loadPlaywright();
    browser = await chromium.launch({
      headless: true,
      executablePath: browserExecutablePath,
    });
    resourceHtml = await readFile(resourcePath, 'utf8');
  });

  afterAll(async () => {
    await browser?.close();
  });

  async function createComponentPage(options?: {
    feedback?: {
      version: number;
      variant?: string;
      original: string;
      bestVersion: string;
      notes: readonly { category: string; message: string }[];
    };
    theme?: 'light' | 'dark';
    clipboard?: 'success' | 'denied';
    width?: number;
  }): Promise<Page> {
    const page = await browser.newPage({
      viewport: { width: options?.width ?? 560, height: 900 },
      colorScheme: options?.theme ?? 'light',
    });
    await page.evaluate(
      ({ feedback, theme, clipboard }) => {
        const testWindow = window as unknown as {
          openai: {
            toolOutput: unknown;
            theme: string;
            notifyIntrinsicHeight: () => void;
          };
          copiedText: string[];
          networkCalls: number;
        };
        testWindow.copiedText = [];
        testWindow.networkCalls = 0;
        testWindow.openai = {
          toolOutput: feedback,
          theme,
          notifyIntrinsicHeight: () => {},
        };
        const originalFetch = window.fetch.bind(window);
        Object.defineProperty(window, 'fetch', {
          configurable: true,
          writable: true,
          value: (...args: Parameters<typeof window.fetch>) => {
            testWindow.networkCalls += 1;
            return originalFetch(...args);
          },
        });
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: async (value: string) => {
              if (clipboard === 'denied') {
                throw new Error('denied');
              }
              testWindow.copiedText.push(value);
            },
          },
        });
      },
      {
        feedback: options?.feedback ?? validFeedback,
        theme: options?.theme ?? 'light',
        clipboard: options?.clipboard ?? 'success',
      },
    );
    await page.setContent(resourceHtml, { waitUntil: 'load' });
    await page.locator('#app').waitFor({ state: 'visible' });
    return page;
  }

  test('renders bridge feedback immediately and reports its content height', async () => {
    const page = await browser.newPage({
      viewport: { width: 560, height: 900 },
    });

    try {
      await page.setContent('<iframe id="component"></iframe>');
      await page.evaluate(
        ({ html, feedback }) => {
          const testWindow = window as unknown as {
            bridgeMessages: Array<Record<string, unknown>>;
          };
          const frame = document.querySelector(
            '#component',
          ) as HTMLIFrameElement;
          testWindow.bridgeMessages = [];
          window.addEventListener('message', (event) => {
            const message = event.data as {
              jsonrpc?: string;
              id?: string;
              method?: string;
              params?: { height?: number };
            };
            if (event.source !== frame.contentWindow) return;
            testWindow.bridgeMessages.push(message);
            if (
              message.method === 'ui/notifications/size-changed' &&
              typeof message.params?.height === 'number'
            ) {
              frame.style.height = `${message.params.height}px`;
            }
            if (message.method === 'ui/initialize') {
              frame.contentWindow?.postMessage(
                {
                  jsonrpc: '2.0',
                  id: message.id,
                  result: {
                    protocolVersion: '2026-01-26',
                    hostInfo: { name: 'test-host', version: '1.0.0' },
                    hostCapabilities: {},
                    hostContext: { theme: 'dark' },
                  },
                },
                '*',
              );
            }
            if (message.method === 'ui/notifications/initialized') {
              frame.contentWindow?.postMessage(
                {
                  jsonrpc: '2.0',
                  method: 'ui/notifications/tool-result',
                  params: { structuredContent: feedback },
                },
                '*',
              );
            }
          });
          frame.srcdoc = html;
        },
        { html: resourceHtml, feedback: validFeedback },
      );

      const component = page.frameLocator('#component');
      await component
        .getByRole('heading', { name: 'English feedback' })
        .waitFor();
      expect(
        await component.getByText(validFeedback.original).isVisible(),
      ).toBe(true);
      expect(
        await component.getByText(validFeedback.bestVersion).isVisible(),
      ).toBe(true);
      expect(
        await component.getByRole('heading', { name: 'You wrote' }).isVisible(),
      ).toBe(true);
      expect(
        await component
          .getByRole('heading', { name: 'Suggested wording' })
          .isVisible(),
      ).toBe(true);
      await expect(
        component.locator('.note-category').allTextContents(),
      ).resolves.toEqual(['Phrasing', 'Clarity']);
      const messages = await page.evaluate(() =>
        (
          window as unknown as {
            bridgeMessages: Array<{ method?: string }>;
          }
        ).bridgeMessages.map((message) => message.method),
      );
      expect(messages[0]).toBe('ui/initialize');
      expect(messages).toContain('ui/notifications/initialized');

      await page.waitForFunction(() => {
        const frame = document.querySelector('#component') as HTMLIFrameElement;
        const contentHeight =
          frame.contentDocument?.body.getBoundingClientRect().height;
        return (
          contentHeight !== undefined &&
          Number.parseFloat(frame.style.height) === Math.ceil(contentHeight)
        );
      });
    } finally {
      await page.close();
    }
  });

  test('resizes below the Codex default minimum without MCP Apps initialization', async () => {
    const page = await browser.newPage({
      viewport: { width: 620, height: 900 },
    });
    const { handleJsonRpcMessage } = await loadServerModule();
    const resourceResult = await handleJsonRpcMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/read',
      params: { uri: 'ui://cthu-language-feedback/v1.html' },
    });
    const resource = resourceResult.result.contents[0];
    const noSuggestions = {
      ...validFeedback,
      original: validFeedback.bestVersion,
      notes: [],
    };

    try {
      await page.setContent(
        '<iframe id="component" style="width:560px;height:480px;border:0"></iframe>',
      );
      await page.evaluate(
        ({ html, feedback, minimumHeight }) => {
          const frame = document.querySelector(
            '#component',
          ) as HTMLIFrameElement;
          const host = window as unknown as {
            reportedHeights: number[];
            compatibilityBridge: {
              toolOutput: unknown;
              notifyIntrinsicHeight: (height: number) => void;
            };
          };
          host.reportedHeights = [];
          host.compatibilityBridge = {
            toolOutput: feedback,
            notifyIntrinsicHeight: (height) => {
              host.reportedHeights.push(height);
              // Codex uses a 200px floor unless resource metadata overrides it.
              frame.style.height = `${Math.max(height, minimumHeight)}px`;
            },
          };
          // This host exposes window.openai but does not answer ui/initialize.
          frame.srcdoc = html.replace(
            '<script>',
            '<script>window.openai = window.parent.compatibilityBridge;',
          );
        },
        {
          html: resource.text,
          feedback: noSuggestions,
          minimumHeight: resource._meta?.['openai/widgetMinFrameHeight'] ?? 200,
        },
      );
      const component = page.frameLocator('#component');
      await component.locator('#no-suggestions').waitFor({ state: 'visible' });
      await page.waitForFunction(
        () =>
          (window as unknown as { reportedHeights: number[] }).reportedHeights
            .length > 0,
        undefined,
        { timeout: 1500 },
      );

      const compactHeight = await page
        .locator('#component')
        .evaluate((frame) => frame.clientHeight);
      expect(compactHeight).toBeGreaterThan(0);
      expect(compactHeight).toBeLessThan(120);

      await component.locator('body').evaluate((_, feedback) => {
        window.dispatchEvent(
          new CustomEvent('openai:set_globals', {
            detail: { globals: { toolOutput: feedback } },
          }),
        );
      }, validFeedback);
      await component.locator('#best-text').waitFor({ state: 'visible' });
      await page.waitForFunction(
        (height) =>
          (document.querySelector('#component') as HTMLIFrameElement)
            .clientHeight > height,
        compactHeight,
      );

      await component.locator('body').evaluate((_, feedback) => {
        window.dispatchEvent(
          new CustomEvent('openai:set_globals', {
            detail: { globals: { toolOutput: feedback } },
          }),
        );
      }, noSuggestions);
      await component.locator('#no-suggestions').waitFor({ state: 'visible' });
      await page.waitForFunction(
        (height) =>
          (document.querySelector('#component') as HTMLIFrameElement)
            .clientHeight === height,
        compactHeight,
      );
      expect(
        await page.locator('#component').evaluate((frame) => {
          const iframe = frame as HTMLIFrameElement;
          const body = iframe.contentDocument?.body;
          if (!body) throw new Error('Expected the feedback document to load.');
          return (
            iframe.clientHeight - Math.ceil(body.getBoundingClientRect().height)
          );
        }),
      ).toBe(0);
    } finally {
      await page.close();
    }
  });

  test('keeps the best version dominant and omits an empty notes section', async () => {
    const page = await createComponentPage({
      feedback: { ...validFeedback, notes: [] },
    });

    try {
      expect(await page.getByText(validFeedback.original).isVisible()).toBe(
        true,
      );
      expect(await page.getByText(validFeedback.bestVersion).isVisible()).toBe(
        true,
      );
      expect(
        await page.getByRole('heading', { name: 'Notes' }).isHidden(),
      ).toBe(true);
      const sizes = await page.evaluate(() => {
        const original = document.querySelector('.original-text');
        const best = document.querySelector('.best-text');
        if (!original || !best) {
          throw new Error('Expected feedback prose elements to render.');
        }
        return {
          original: Number.parseFloat(getComputedStyle(original).fontSize),
          best: Number.parseFloat(getComputedStyle(best).fontSize),
        };
      });
      expect(sizes.best).toBeGreaterThan(sizes.original);
    } finally {
      await page.close();
    }
  });

  test('replaces the loading placeholder when feedback arrives through the bridge', async () => {
    const page = await browser.newPage({
      viewport: { width: 560, height: 900 },
    });
    try {
      await page.setContent(resourceHtml, { waitUntil: 'load' });
      expect(await page.locator('#loading').isVisible()).toBe(true);
      expect(await page.locator('#app').isHidden()).toBe(true);
      expect(await page.locator('#loading').textContent()).toContain(
        'Loading feedback…',
      );

      await page.evaluate((feedback) => {
        window.postMessage(
          {
            jsonrpc: '2.0',
            method: 'ui/notifications/tool-result',
            params: { structuredContent: feedback },
          },
          '*',
        );
      }, validFeedback);
      await page.locator('#app').waitFor({ state: 'visible' });

      // Test rendered visibility, not just the hidden attribute: author CSS can override it.
      expect(await page.locator('#loading').isHidden()).toBe(true);
      expect(await page.locator('#loading').boundingBox()).toBeNull();
      expect(await page.getByText(validFeedback.bestVersion).isVisible()).toBe(
        true,
      );
    } finally {
      await page.close();
    }
  });

  test('shows a short confirmation without suggestions and restores detail for edits', async () => {
    const page = await createComponentPage({
      feedback: {
        ...validFeedback,
        original: validFeedback.bestVersion,
        notes: [],
      },
    });

    try {
      expect(
        await page
          .getByText(
            'Your message is grammatically correct and sounds natural.',
          )
          .isVisible(),
      ).toBe(true);
      expect((await page.locator('#app').innerText()).trim()).toBe(
        'Your message is grammatically correct and sounds natural.',
      );
      expect(await page.locator('#original-text').isHidden()).toBe(true);
      expect(await page.locator('#best-text').isHidden()).toBe(true);
      expect(await page.locator('#copy-button').isHidden()).toBe(true);
      expect(await page.locator('#notes-block').isHidden()).toBe(true);
      const compactHeight =
        (await page.locator('.coach-card').boundingBox())?.height ?? 0;

      await page.evaluate((feedback) => {
        window.postMessage(
          {
            jsonrpc: '2.0',
            method: 'ui/notifications/tool-result',
            params: { structuredContent: feedback },
          },
          '*',
        );
      }, validFeedback);
      await page
        .getByRole('heading', { name: 'Suggested wording', exact: true })
        .waitFor();
      expect(
        await page.getByRole('button', { name: 'Copy suggestion' }).isVisible(),
      ).toBe(true);
      expect(await page.locator('#copy-status').textContent()).toBe('');
      expect(
        await page.getByRole('heading', { name: 'Notes' }).isVisible(),
      ).toBe(true);
      expect(await page.locator('#no-suggestions').isHidden()).toBe(true);
      expect(
        (await page.locator('.coach-card').boundingBox())?.height ?? 0,
      ).toBeGreaterThan(compactHeight);
      await page.getByRole('button', { name: 'Copy suggestion' }).click();
      expect(await page.locator('#copy-status').textContent()).toBe(
        'Copied to clipboard.',
      );

      await page.evaluate((feedback) => {
        window.dispatchEvent(
          new CustomEvent('openai:set_globals', {
            detail: {
              globals: {
                toolOutput: {
                  ...feedback,
                  original: feedback.bestVersion,
                  notes: [],
                },
              },
            },
          }),
        );
      }, validFeedback);
      await page.locator('#no-suggestions').waitFor({ state: 'visible' });
      expect(await page.locator('#copy-status').textContent()).toBe('');
      expect(await page.locator('#copy-button').isHidden()).toBe(true);
      expect((await page.locator('.coach-card').boundingBox())?.height).toBe(
        compactHeight,
      );
    } finally {
      await page.close();
    }
  });

  test('keeps optional notes visible even when the wording is unchanged', async () => {
    const page = await createComponentPage({
      feedback: { ...validFeedback, original: validFeedback.bestVersion },
    });

    try {
      expect(await page.locator('#no-suggestions').isHidden()).toBe(true);
      expect(
        await page
          .getByRole('heading', { name: 'No changes needed' })
          .isVisible(),
      ).toBe(true);
      expect(await page.locator('#notes-block').isVisible()).toBe(true);
      await page
        .getByRole('button', { name: 'Copy text', exact: true })
        .click();
      expect(await page.locator('#copy-status').textContent()).toBe(
        'Copied to clipboard.',
      );
    } finally {
      await page.close();
    }
  });

  test('adapts to dark theme and a narrow inline layout without clipping', async () => {
    const page = await createComponentPage({ theme: 'dark', width: 300 });

    try {
      const layout = await page.evaluate(() => {
        const card = document.querySelector('.coach-card');
        if (!card) {
          throw new Error('Expected the feedback card to render.');
        }
        return {
          theme: document.documentElement.dataset.theme,
          documentWidth: document.documentElement.clientWidth,
          contentWidth: document.documentElement.scrollWidth,
          background: getComputedStyle(card).backgroundColor,
        };
      });
      expect(layout.theme).toBe('dark');
      expect(layout.contentWidth).toBeLessThanOrEqual(layout.documentWidth);
      expect(layout.background).not.toBe('rgb(255, 255, 255)');
    } finally {
      await page.close();
    }
  });

  test('copies only the best version through keyboard activation without tool or network calls', async () => {
    const page = await createComponentPage();

    try {
      const button = page.getByRole('button', { name: 'Copy suggestion' });
      await button.focus();
      await page.keyboard.press('Enter');
      expect(await page.getByRole('status').last().textContent()).toBe(
        'Copied to clipboard.',
      );
      const activity = await page.evaluate(() => {
        const testWindow = window as unknown as {
          copiedText: string[];
          networkCalls: number;
        };
        return {
          copiedText: testWindow.copiedText,
          networkCalls: testWindow.networkCalls,
        };
      });
      expect(activity.copiedText).toEqual([validFeedback.bestVersion]);
      expect(activity.networkCalls).toBe(0);
    } finally {
      await page.close();
    }
  });

  test('reports denied clipboard access and selects the best version', async () => {
    const page = await createComponentPage({
      clipboard: 'denied',
    });

    try {
      await page.getByRole('button', { name: 'Copy suggestion' }).click();
      expect(await page.getByRole('status').last().textContent()).toContain(
        'Copy the selected text manually',
      );
      expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
        validFeedback.bestVersion,
      );
    } finally {
      await page.close();
    }
  });
});
