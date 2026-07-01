import { BrowserClientError } from './errors';
import { BrowserHttpTransport } from './transport';
import type {
  BrowserAction,
  BrowserActionResult,
  BrowserActionSuccessResult,
  BrowserExtractFields,
  BrowserExtractListOptions,
  BrowserExtractRecord,
  BrowserGotoOptions,
  BrowserInteractionOptions,
  BrowserLinkRecord,
  BrowserResponseMatch,
  BrowserResponseSummary,
  BrowserRunActionsOptions,
  BrowserScreenshot,
  BrowserScreenshotOptions,
  BrowserScrollOptions,
  BrowserSelectorOptions,
  BrowserSession,
  BrowserSessionOptions,
  BrowserUrlMatch,
  BrowserWaitForLoadStateOptions,
  BrowserWaitForResponseOptions,
  BrowserWaitForUrlOptions,
  CthuBrowserClientOptions,
} from './types';

type CreateSessionEnvelope = BrowserSession | { readonly session: unknown };

type RunActionsEnvelope =
  | readonly BrowserActionResult[]
  | { readonly results?: unknown; readonly actionResults?: unknown };

export class CthuBrowserClient {
  private readonly transport: BrowserHttpTransport;

  constructor(options: CthuBrowserClientOptions) {
    this.transport = new BrowserHttpTransport(options);
  }

  async createSession(options: BrowserSessionOptions = {}) {
    const response = await this.transport.requestJson<CreateSessionEnvelope>({
      body: normalizeSessionOptions(options),
      method: 'POST',
      path: '/api/browser/sessions',
    });

    return normalizeSession(response);
  }

  async runActions(
    sessionId: string,
    actions: readonly BrowserAction[],
    options: BrowserRunActionsOptions = {},
  ): Promise<BrowserActionResult[]> {
    const response = await this.transport.requestJson<RunActionsEnvelope>({
      body: { actions },
      method: 'POST',
      path: `/api/browser/sessions/${encodeURIComponent(sessionId)}/actions`,
      signal: options.signal,
    });

    return normalizeActionResults(response);
  }

  async closeSession(sessionId: string): Promise<void> {
    await this.transport.requestJson<void>({
      method: 'DELETE',
      path: `/api/browser/sessions/${encodeURIComponent(sessionId)}`,
    });
  }

  async newPage(options: BrowserSessionOptions = {}): Promise<BrowserPage> {
    const session = await this.createSession(options);
    return new BrowserPage(this, session);
  }

  async withPage<T>(
    options: BrowserSessionOptions,
    callback: (page: BrowserPage) => Promise<T>,
  ): Promise<T> {
    const page = await this.newPage(options);

    try {
      const result = await callback(page);
      await page.close();
      return result;
    } catch (error) {
      try {
        await page.close();
      } catch {
        // Preserve the original callback error.
      }
      throw error;
    }
  }
}

export class BrowserPage {
  readonly session: BrowserSession;
  private closed = false;

  constructor(
    private readonly client: Pick<
      CthuBrowserClient,
      'closeSession' | 'runActions'
    >,
    session: BrowserSession,
  ) {
    this.session = session;
  }

  get sessionId(): string {
    return this.session.sessionId;
  }

  get isClosed(): boolean {
    return this.closed;
  }

  async goto(
    url: string,
    options: BrowserGotoOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      timeoutMs: options.timeoutMs,
      type: 'goto',
      url,
      waitUntil: options.waitUntil,
    });
  }

  async waitForSelector(
    selector: string,
    options: BrowserSelectorOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'waitForSelector',
    });
  }

  async waitForLoadState(
    state: 'domcontentloaded' | 'load' | 'networkidle',
    options: BrowserWaitForLoadStateOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      state,
      timeoutMs: options.timeoutMs,
      type: 'waitForLoadState',
    });
  }

  async waitForURL(
    target: string | BrowserUrlMatch,
    options: BrowserWaitForUrlOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      target: normalizeUrlMatch(target),
      timeoutMs: options.timeoutMs,
      type: 'waitForURL',
    });
  }

  async waitForResponse(
    target: string | BrowserResponseMatch,
    options: BrowserWaitForResponseOptions = {},
  ): Promise<BrowserResponseSummary> {
    const result = await this.runSingleAction({
      target: normalizeResponseMatch(target),
      timeoutMs: options.timeoutMs,
      type: 'waitForResponse',
    });
    if (isRecord(result.response)) {
      return result.response as BrowserResponseSummary;
    }
    throw malformedActionResult('waitForResponse');
  }

  async url(): Promise<string> {
    const result = await this.runSingleAction({ type: 'url' });
    if (typeof result.url === 'string') {
      return result.url;
    }
    if (typeof result.value === 'string') {
      return result.value;
    }
    throw malformedActionResult('url');
  }

  async click(
    selector: string,
    options: BrowserSelectorOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'click',
    });
  }

  async fill(
    selector: string,
    value: string,
    options: BrowserSelectorOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'fill',
      value,
    });
  }

  async press(
    selector: string,
    key: string,
    options: BrowserInteractionOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      key,
      selector,
      timeoutMs: options.timeoutMs,
      type: 'press',
    });
  }

  async hover(
    selector: string,
    options: BrowserInteractionOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'hover',
    });
  }

  async selectOption(
    selector: string,
    value: string,
    options: BrowserInteractionOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'selectOption',
      value,
    });
  }

  async check(
    selector: string,
    options: BrowserInteractionOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'check',
    });
  }

  async uncheck(
    selector: string,
    options: BrowserInteractionOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    return this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'uncheck',
    });
  }

  async scroll(
    target: 'page' | string = 'page',
    options: BrowserScrollOptions = {},
  ): Promise<BrowserActionSuccessResult> {
    const selector = target === 'page' ? undefined : target;
    return this.runSingleAction({
      selector,
      target: selector ? 'selector' : 'page',
      timeoutMs: options.timeoutMs,
      type: 'scroll',
      x: options.x,
      y: options.y,
    });
  }

  async textContent(
    selector: string,
    options: BrowserSelectorOptions = {},
  ): Promise<string | null> {
    const result = await this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'textContent',
    });

    if (typeof result.text === 'string' || result.text === null) {
      return result.text;
    }
    if (typeof result.value === 'string') {
      return result.value;
    }
    return null;
  }

  async content(): Promise<string> {
    const result = await this.runSingleAction({ type: 'content' });
    if (typeof result.html === 'string') {
      return result.html;
    }
    if (typeof result.value === 'string') {
      return result.value;
    }
    throw malformedActionResult('content');
  }

  async innerText(
    selector: string,
    options: BrowserSelectorOptions = {},
  ): Promise<string> {
    const result = await this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'innerText',
    });
    if (typeof result.text === 'string') {
      return result.text;
    }
    throw malformedActionResult('innerText');
  }

  async innerHTML(
    selector: string,
    options: BrowserSelectorOptions = {},
  ): Promise<string> {
    const result = await this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'innerHTML',
    });
    if (typeof result.html === 'string') {
      return result.html;
    }
    throw malformedActionResult('innerHTML');
  }

  async getAttribute(
    selector: string,
    name: string,
    options: BrowserSelectorOptions = {},
  ): Promise<string | null> {
    const result = await this.runSingleAction({
      name,
      selector,
      timeoutMs: options.timeoutMs,
      type: 'getAttribute',
    });
    if (typeof result.attribute === 'string' || result.attribute === null) {
      return result.attribute;
    }
    return null;
  }

  async locatorCount(
    selector: string,
    options: BrowserSelectorOptions = {},
  ): Promise<number> {
    const result = await this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'locatorCount',
    });
    if (typeof result.count === 'number') {
      return result.count;
    }
    throw malformedActionResult('locatorCount');
  }

  async allTextContents(
    selector: string,
    options: BrowserSelectorOptions = {},
  ): Promise<readonly string[]> {
    const result = await this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'allTextContents',
    });
    if (Array.isArray(result.texts)) {
      return result.texts;
    }
    throw malformedActionResult('allTextContents');
  }

  async exists(
    selector: string,
    options: BrowserSelectorOptions = {},
  ): Promise<boolean> {
    const result = await this.runSingleAction({
      selector,
      timeoutMs: options.timeoutMs,
      type: 'exists',
    });
    if (typeof result.exists === 'boolean') {
      return result.exists;
    }
    throw malformedActionResult('exists');
  }

  async extractList(
    itemSelector: string,
    fields: BrowserExtractFields,
    options: BrowserExtractListOptions = {},
  ): Promise<readonly BrowserExtractRecord[]> {
    const result = await this.runSingleAction({
      fields,
      itemSelector,
      limit: options.limit,
      timeoutMs: options.timeoutMs,
      type: 'extractList',
    });
    if (Array.isArray(result.items)) {
      return result.items;
    }
    throw malformedActionResult('extractList');
  }

  async extractLinks(
    options: { readonly selector?: string; readonly timeoutMs?: number } = {},
  ): Promise<readonly BrowserLinkRecord[]> {
    const result = await this.runSingleAction({
      selector: options.selector,
      timeoutMs: options.timeoutMs,
      type: 'extractLinks',
    });
    if (Array.isArray(result.links)) {
      return result.links;
    }
    throw malformedActionResult('extractLinks');
  }

  async extractMeta(
    options: { readonly timeoutMs?: number } = {},
  ): Promise<BrowserExtractRecord> {
    const result = await this.runSingleAction({
      timeoutMs: options.timeoutMs,
      type: 'extractMeta',
    });
    if (isRecord(result.meta)) {
      return result.meta as BrowserExtractRecord;
    }
    throw malformedActionResult('extractMeta');
  }

  async extractJsonLd(
    options: { readonly timeoutMs?: number } = {},
  ): Promise<readonly unknown[]> {
    const result = await this.runSingleAction({
      timeoutMs: options.timeoutMs,
      type: 'extractJsonLd',
    });
    if (Array.isArray(result.jsonLd)) {
      return result.jsonLd;
    }
    throw malformedActionResult('extractJsonLd');
  }

  async title(): Promise<string> {
    const result = await this.runSingleAction({ type: 'title' });
    if (typeof result.title === 'string') {
      return result.title;
    }
    if (typeof result.value === 'string') {
      return result.value;
    }
    throw malformedActionResult('title');
  }

  async screenshot(
    options: BrowserScreenshotOptions = {},
  ): Promise<BrowserScreenshot> {
    const result = await this.runSingleAction({
      fullPage: options.fullPage,
      timeoutMs: options.timeoutMs,
      type: 'screenshot',
    });
    const base64 =
      result.base64 ??
      result.screenshotBase64 ??
      (typeof result.value === 'string' ? result.value : undefined);
    if (!base64) {
      throw malformedActionResult('screenshot');
    }
    return { base64, mimeType: result.mimeType };
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    await this.client.closeSession(this.sessionId);
    this.closed = true;
  }

  private async runSingleAction(
    action: BrowserAction,
  ): Promise<BrowserActionSuccessResult> {
    this.assertOpen();
    const [result] = await this.client.runActions(this.sessionId, [action]);

    if (!result) {
      throw malformedActionResult(action.type);
    }
    if (result.ok === false) {
      throw new BrowserClientError({
        code: result.code,
        message: result.message,
        metadata: result.metadata,
      });
    }
    return result;
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new BrowserClientError({
        code: 'CLOSED_PAGE',
        message: `Browser page session "${this.sessionId}" is closed`,
      });
    }
  }
}

function normalizeSession(response: CreateSessionEnvelope): BrowserSession {
  const value =
    isRecord(response) && 'session' in response ? response.session : response;
  if (!isRecord(value) || typeof value.sessionId !== 'string') {
    throw new BrowserClientError({
      code: 'MALFORMED_RESPONSE',
      message: 'Browser API create-session response did not include sessionId',
    });
  }

  return value as BrowserSession;
}

function normalizeSessionOptions(
  options: BrowserSessionOptions,
): BrowserSessionOptions & { readonly ttlMs?: number } {
  const { expiresInMs, ...rest } = options;
  return {
    ...rest,
    ...(rest.ttlMs === undefined && expiresInMs !== undefined
      ? { ttlMs: expiresInMs }
      : {}),
  };
}

function normalizeActionResults(response: RunActionsEnvelope) {
  const value = Array.isArray(response)
    ? response
    : isRecord(response) && Array.isArray(response.results)
      ? response.results
      : isRecord(response) && Array.isArray(response.actionResults)
        ? response.actionResults
        : undefined;

  if (!value) {
    throw new BrowserClientError({
      code: 'MALFORMED_RESPONSE',
      message: 'Browser API run-actions response did not include results',
    });
  }

  return value as BrowserActionResult[];
}

function malformedActionResult(actionType: string): BrowserClientError {
  return new BrowserClientError({
    code: 'MALFORMED_RESPONSE',
    message: `Browser API action "${actionType}" returned an unexpected result`,
  });
}

function normalizeUrlMatch(target: string | BrowserUrlMatch): BrowserUrlMatch {
  if (typeof target !== 'string') {
    return target;
  }
  return isHttpUrl(target) ? { url: target } : { pattern: target };
}

function normalizeResponseMatch(
  target: string | BrowserResponseMatch,
): BrowserResponseMatch {
  if (typeof target !== 'string') {
    return target;
  }
  return normalizeUrlMatch(target);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
