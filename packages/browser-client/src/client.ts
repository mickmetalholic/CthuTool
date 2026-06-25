import { BrowserClientError } from './errors';
import { BrowserHttpTransport } from './transport';
import type {
  BrowserAction,
  BrowserActionResult,
  BrowserActionSuccessResult,
  BrowserGotoOptions,
  BrowserRunActionsOptions,
  BrowserScreenshot,
  BrowserScreenshotOptions,
  BrowserSelectorOptions,
  BrowserSession,
  BrowserSessionOptions,
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
      body: options,
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
    if (!result.ok) {
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

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
