export type BrowserAuthPolicy = 'anonymous' | 'required';

export type BrowserWaitUntil = 'domcontentloaded' | 'load' | 'networkidle';

export type BrowserActionType =
  | 'goto'
  | 'waitForSelector'
  | 'click'
  | 'fill'
  | 'textContent'
  | 'content'
  | 'title'
  | 'screenshot';

export type BrowserClientHeaders = Readonly<Record<string, string>>;

export type BrowserClientFetchInit = {
  readonly method?: string;
  readonly headers?: BrowserClientHeaders;
  readonly body?: string;
  readonly signal?: AbortSignal;
};

export type BrowserClientFetchResponse = {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
};

export type BrowserClientFetch = (
  input: string,
  init?: BrowserClientFetchInit,
) => Promise<BrowserClientFetchResponse>;

export type CthuBrowserClientOptions = {
  readonly baseUrl: string;
  readonly headers?: BrowserClientHeaders;
  readonly fetch?: BrowserClientFetch;
  readonly signal?: AbortSignal;
};

export type BrowserSessionOptions = {
  readonly siteId?: string;
  readonly profileName?: string;
  readonly authPolicy?: BrowserAuthPolicy;
  readonly timeoutMs?: number;
  readonly ttlMs?: number;
  readonly expiresInMs?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
};

export type BrowserSession = {
  readonly sessionId: string;
  readonly siteId?: string;
  readonly profileName?: string;
  readonly createdAt?: string;
  readonly expiresAt?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
};

export type BrowserActionBase = {
  readonly actionId?: string;
  readonly timeoutMs?: number;
};

export type BrowserGotoAction = BrowserActionBase & {
  readonly type: 'goto';
  readonly url: string;
  readonly waitUntil?: BrowserWaitUntil;
};

export type BrowserWaitForSelectorAction = BrowserActionBase & {
  readonly type: 'waitForSelector';
  readonly selector: string;
};

export type BrowserClickAction = BrowserActionBase & {
  readonly type: 'click';
  readonly selector: string;
};

export type BrowserFillAction = BrowserActionBase & {
  readonly type: 'fill';
  readonly selector: string;
  readonly value: string;
};

export type BrowserTextContentAction = BrowserActionBase & {
  readonly type: 'textContent';
  readonly selector: string;
};

export type BrowserContentAction = BrowserActionBase & {
  readonly type: 'content';
};

export type BrowserTitleAction = BrowserActionBase & {
  readonly type: 'title';
};

export type BrowserScreenshotAction = BrowserActionBase & {
  readonly type: 'screenshot';
  readonly fullPage?: boolean;
};

export type BrowserAction =
  | BrowserGotoAction
  | BrowserWaitForSelectorAction
  | BrowserClickAction
  | BrowserFillAction
  | BrowserTextContentAction
  | BrowserContentAction
  | BrowserTitleAction
  | BrowserScreenshotAction;

export type BrowserActionSuccessResult = {
  readonly ok?: true;
  readonly actionId?: string;
  readonly type: BrowserActionType;
  readonly durationMs?: number;
  readonly value?: unknown;
  readonly finalUrl?: string;
  readonly status?: number;
  readonly text?: string | null;
  readonly html?: string;
  readonly title?: string;
  readonly base64?: string;
  readonly screenshotBase64?: string;
  readonly mimeType?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
};

export type BrowserActionErrorResult = {
  readonly ok: false;
  readonly actionId?: string;
  readonly type?: BrowserActionType;
  readonly code: string;
  readonly message: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
};

export type BrowserActionResult =
  | BrowserActionSuccessResult
  | BrowserActionErrorResult;

export type BrowserRunActionsOptions = {
  readonly signal?: AbortSignal;
};

export type BrowserScreenshot = {
  readonly base64: string;
  readonly mimeType?: string;
};

export type BrowserGotoOptions = {
  readonly waitUntil?: BrowserWaitUntil;
  readonly timeoutMs?: number;
};

export type BrowserSelectorOptions = {
  readonly timeoutMs?: number;
};

export type BrowserScreenshotOptions = {
  readonly fullPage?: boolean;
  readonly timeoutMs?: number;
};

export type BrowserClientErrorCode =
  | 'BACKEND_ERROR'
  | 'CLOSED_PAGE'
  | 'MALFORMED_RESPONSE'
  | 'TRANSPORT_ERROR';
