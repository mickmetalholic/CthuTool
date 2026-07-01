export type BrowserAuthPolicy = 'anonymous' | 'required';

export type BrowserWaitUntil = 'domcontentloaded' | 'load' | 'networkidle';

export type BrowserActionType =
  | 'goto'
  | 'waitForSelector'
  | 'waitForLoadState'
  | 'waitForURL'
  | 'waitForResponse'
  | 'url'
  | 'click'
  | 'fill'
  | 'press'
  | 'hover'
  | 'selectOption'
  | 'check'
  | 'uncheck'
  | 'scroll'
  | 'textContent'
  | 'innerText'
  | 'innerHTML'
  | 'getAttribute'
  | 'locatorCount'
  | 'allTextContents'
  | 'exists'
  | 'content'
  | 'title'
  | 'screenshot'
  | 'extractList'
  | 'extractLinks'
  | 'extractMeta'
  | 'extractJsonLd';

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

export type BrowserWaitForLoadStateAction = BrowserActionBase & {
  readonly type: 'waitForLoadState';
  readonly state: BrowserWaitUntil;
};

export type BrowserUrlMatch = {
  readonly url?: string;
  readonly pattern?: string;
};

export type BrowserResponseMatch = BrowserUrlMatch & {
  readonly method?: string;
  readonly status?: number;
};

export type BrowserWaitForUrlAction = BrowserActionBase & {
  readonly type: 'waitForURL';
  readonly target: BrowserUrlMatch;
};

export type BrowserWaitForResponseAction = BrowserActionBase & {
  readonly type: 'waitForResponse';
  readonly target: BrowserResponseMatch;
};

export type BrowserUrlAction = BrowserActionBase & {
  readonly type: 'url';
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

export type BrowserPressAction = BrowserActionBase & {
  readonly type: 'press';
  readonly selector: string;
  readonly key: string;
};

export type BrowserHoverAction = BrowserActionBase & {
  readonly type: 'hover';
  readonly selector: string;
};

export type BrowserSelectOptionAction = BrowserActionBase & {
  readonly type: 'selectOption';
  readonly selector: string;
  readonly value: string;
};

export type BrowserCheckAction = BrowserActionBase & {
  readonly type: 'check';
  readonly selector: string;
};

export type BrowserUncheckAction = BrowserActionBase & {
  readonly type: 'uncheck';
  readonly selector: string;
};

export type BrowserScrollAction = BrowserActionBase & {
  readonly type: 'scroll';
  readonly target?: 'page' | 'selector';
  readonly selector?: string;
  readonly x?: number;
  readonly y?: number;
};

export type BrowserTextContentAction = BrowserActionBase & {
  readonly type: 'textContent';
  readonly selector: string;
};

export type BrowserInnerTextAction = BrowserActionBase & {
  readonly type: 'innerText';
  readonly selector: string;
};

export type BrowserInnerHtmlAction = BrowserActionBase & {
  readonly type: 'innerHTML';
  readonly selector: string;
};

export type BrowserGetAttributeAction = BrowserActionBase & {
  readonly type: 'getAttribute';
  readonly selector: string;
  readonly name: string;
};

export type BrowserLocatorCountAction = BrowserActionBase & {
  readonly type: 'locatorCount';
  readonly selector: string;
};

export type BrowserAllTextContentsAction = BrowserActionBase & {
  readonly type: 'allTextContents';
  readonly selector: string;
};

export type BrowserExistsAction = BrowserActionBase & {
  readonly type: 'exists';
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

export type BrowserExtractFieldType =
  | 'text'
  | 'innerText'
  | 'html'
  | 'attribute'
  | 'exists'
  | 'count';

export type BrowserExtractField = {
  readonly type: BrowserExtractFieldType;
  readonly selector?: string;
  readonly attribute?: string;
  readonly required?: boolean;
};

export type BrowserExtractFields = Readonly<
  Record<string, BrowserExtractField>
>;

export type BrowserExtractListAction = BrowserActionBase & {
  readonly type: 'extractList';
  readonly itemSelector: string;
  readonly fields: BrowserExtractFields;
  readonly limit?: number;
};

export type BrowserExtractLinksAction = BrowserActionBase & {
  readonly type: 'extractLinks';
  readonly selector?: string;
};

export type BrowserExtractMetaAction = BrowserActionBase & {
  readonly type: 'extractMeta';
};

export type BrowserExtractJsonLdAction = BrowserActionBase & {
  readonly type: 'extractJsonLd';
};

export type BrowserAction =
  | BrowserGotoAction
  | BrowserWaitForSelectorAction
  | BrowserWaitForLoadStateAction
  | BrowserWaitForUrlAction
  | BrowserWaitForResponseAction
  | BrowserUrlAction
  | BrowserClickAction
  | BrowserFillAction
  | BrowserPressAction
  | BrowserHoverAction
  | BrowserSelectOptionAction
  | BrowserCheckAction
  | BrowserUncheckAction
  | BrowserScrollAction
  | BrowserTextContentAction
  | BrowserInnerTextAction
  | BrowserInnerHtmlAction
  | BrowserGetAttributeAction
  | BrowserLocatorCountAction
  | BrowserAllTextContentsAction
  | BrowserExistsAction
  | BrowserContentAction
  | BrowserTitleAction
  | BrowserScreenshotAction
  | BrowserExtractListAction
  | BrowserExtractLinksAction
  | BrowserExtractMetaAction
  | BrowserExtractJsonLdAction;

export type BrowserActionSuccessResult = {
  readonly ok?: true;
  readonly actionId?: string;
  readonly type: BrowserActionType;
  readonly durationMs?: number;
  readonly value?: unknown;
  readonly finalUrl?: string;
  readonly status?: number;
  readonly text?: string | null;
  readonly texts?: readonly string[];
  readonly html?: string;
  readonly attribute?: string | null;
  readonly count?: number;
  readonly exists?: boolean;
  readonly url?: string;
  readonly title?: string;
  readonly base64?: string;
  readonly screenshotBase64?: string;
  readonly mimeType?: string;
  readonly items?: readonly BrowserExtractRecord[];
  readonly links?: readonly BrowserLinkRecord[];
  readonly meta?: BrowserExtractRecord;
  readonly jsonLd?: readonly unknown[];
  readonly response?: BrowserResponseSummary;
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

export type BrowserWaitForLoadStateOptions = {
  readonly timeoutMs?: number;
};

export type BrowserWaitForUrlOptions = {
  readonly timeoutMs?: number;
};

export type BrowserWaitForResponseOptions = {
  readonly timeoutMs?: number;
};

export type BrowserInteractionOptions = {
  readonly timeoutMs?: number;
};

export type BrowserScrollOptions = {
  readonly timeoutMs?: number;
  readonly x?: number;
  readonly y?: number;
};

export type BrowserExtractListOptions = {
  readonly timeoutMs?: number;
  readonly limit?: number;
};

export type BrowserExtractRecord = Readonly<Record<string, unknown>>;

export type BrowserLinkRecord = {
  readonly href?: string;
  readonly text?: string;
  readonly [key: string]: unknown;
};

export type BrowserResponseSummary = {
  readonly url?: string;
  readonly method?: string;
  readonly status?: number;
  readonly contentType?: string;
  readonly [key: string]: unknown;
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
