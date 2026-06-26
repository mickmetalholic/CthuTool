import { mkdir } from 'node:fs/promises';
import type { AgentObservabilityMetadata } from '@cthutool/agent-protocol';
import type {
  BrowserAction,
  BrowserActionResult,
  BrowserChallenge,
  BrowserDetection,
  BrowserRuntimeErrorCode,
  BrowserRuntimeMethod,
  BrowserRuntimeParamsByMethod,
  BrowserRuntimeRequest,
  BrowserRuntimeResponse,
  BrowserProfileStatus as RuntimeBrowserProfileStatus,
} from '@cthutool/browser-runtime-protocol';
import {
  createBrowserRuntimeErrorResponse,
  createBrowserRuntimeSuccessResponse,
} from '@cthutool/browser-runtime-protocol';
import type { Route } from 'playwright';
import { chromium } from 'playwright';
import type {
  BrowserProfileStatus,
  BrowserProfileStore,
} from './browser-profile-store';
import type { DesktopBrowserRuntime } from './config';
import {
  createDesktopObservabilityEvent,
  type DesktopObservabilityEventName,
  type DesktopObservabilityLevel,
  type DesktopObservabilitySink,
  observabilityDetailsFromMetadata,
} from './observability';

type RuntimeResponse = {
  readonly status: () => number;
};

type RuntimeLocator = {
  readonly click: (options?: { readonly timeout?: number }) => Promise<void>;
  readonly fill: (
    value: string,
    options?: { readonly timeout?: number },
  ) => Promise<void>;
  readonly textContent: () => Promise<string | null>;
  readonly waitFor: (options?: { readonly timeout?: number }) => Promise<void>;
};

type RuntimePage = {
  readonly content: () => Promise<string>;
  readonly goto: (
    url: string,
    options: {
      readonly timeout?: number;
      readonly waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    },
  ) => Promise<RuntimeResponse | null>;
  readonly locator: (selector: string) => RuntimeLocator;
  readonly screenshot: (options: {
    readonly fullPage: boolean;
  }) => Promise<Buffer>;
  readonly title: () => Promise<string>;
  readonly url: () => string;
};

type RuntimeContext = {
  readonly close: () => Promise<void>;
  readonly newPage: () => Promise<RuntimePage>;
  readonly on?: (event: 'close', handler: () => void) => void;
  readonly route: (
    pattern: string,
    handler: (route: Route) => unknown,
  ) => Promise<void>;
};

type RuntimeBrowser = {
  readonly close: () => Promise<void>;
  readonly newContext: () => Promise<RuntimeContext>;
};

type RuntimeLaunchOptions = {
  readonly channel?: string;
  readonly executablePath?: string;
  readonly headless: boolean;
};

type ChromiumRuntime = {
  readonly launch: (options: RuntimeLaunchOptions) => Promise<RuntimeBrowser>;
  readonly launchPersistentContext: (
    userDataDir: string,
    options: RuntimeLaunchOptions,
  ) => Promise<RuntimeContext>;
};

export type BrowserRuntimeDiagnostic = {
  readonly activeKind?: DesktopBrowserRuntime['kind'];
  readonly message: string;
  readonly preferredKind: DesktopBrowserRuntime['kind'];
  readonly status: 'pending' | 'ready' | 'unavailable';
};

type ResolvedBrowserRuntime = {
  readonly diagnostic: BrowserRuntimeDiagnostic;
  readonly launchOptions: Omit<RuntimeLaunchOptions, 'headless'>;
};

type RuntimeValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

type RuntimeValidator = (input: {
  readonly kind: DesktopBrowserRuntime['kind'];
  readonly launchOptions: Omit<RuntimeLaunchOptions, 'headless'>;
  readonly runtime: ChromiumRuntime;
}) => Promise<RuntimeValidationResult>;

type ProfileVerificationResult = {
  readonly detection: BrowserDetection;
  readonly displayName?: string;
  readonly externalUserId?: string;
  readonly finalUrl?: string;
  readonly response?: RuntimeResponse | null;
  readonly status: BrowserProfileStatus;
  readonly title?: string;
};

type ProfileVerifier = (input: {
  readonly command: BrowserHostCommand;
  readonly context: RuntimeContext;
}) => Promise<ProfileVerificationResult>;

type BrowserSession = {
  readonly sessionId: string;
  readonly siteId: string;
  readonly profileName?: string;
  readonly context: RuntimeContext;
  readonly page: RuntimePage;
  readonly close: () => Promise<void>;
  readonly createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
};

const profileVerifiers = new Map<string, ProfileVerifier>([
  ['douban', verifyDoubanProfile],
]);

export type PlaywrightHostOptions = {
  readonly agentId: string;
  readonly browserRuntime?: DesktopBrowserRuntime;
  readonly headless?: boolean;
  readonly maxPayloadBytes?: number;
  readonly profileStore: BrowserProfileStore;
  readonly runtime?: ChromiumRuntime;
  readonly runtimeValidator?: RuntimeValidator;
  readonly now?: () => Date;
  readonly observability?: DesktopObservabilitySink;
  readonly onStateChanged?: () => void | Promise<void>;
};

type BrowserHostCommand<
  TMethod extends BrowserRuntimeMethod = BrowserRuntimeMethod,
> = BrowserRuntimeParamsByMethod[TMethod] & {
  readonly command: TMethod;
  readonly commandId: string | number;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly waitUntil?: 'domcontentloaded' | 'load' | 'networkidle';
  readonly observability?: AgentObservabilityMetadata;
};

export class PlaywrightHost {
  private readonly runtime: ChromiumRuntime;
  private readonly runtimeValidator: RuntimeValidator;
  private readonly headless: boolean;
  private readonly maxPayloadBytes: number;
  private readonly now: () => Date;
  private readonly loginContexts = new Map<string, RuntimeContext>();
  private readonly browserSessions = new Map<string, BrowserSession>();
  private readonly suppressedLoginContextCloses = new Set<string>();
  private runtimeConfig: DesktopBrowserRuntime;
  private resolvedRuntime?: ResolvedBrowserRuntime;
  private runtimeInitialization?: Promise<void>;
  private stateChanged?: () => void | Promise<void>;
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly options: PlaywrightHostOptions) {
    this.runtime = (options.runtime ?? chromium) as ChromiumRuntime;
    this.runtimeValidator = options.runtimeValidator ?? validateRuntimeLaunch;
    this.runtimeConfig = options.browserRuntime ?? { kind: 'host-chrome' };
    this.headless = options.headless ?? true;
    this.maxPayloadBytes = options.maxPayloadBytes ?? 2_000_000;
    this.now = options.now ?? (() => new Date());
    this.stateChanged = options.onStateChanged;
  }

  setStateChangedCallback(callback: () => void | Promise<void>): void {
    this.stateChanged = callback;
  }

  setBrowserRuntime(runtime: DesktopBrowserRuntime): void {
    this.runtimeConfig = runtime;
    this.resolvedRuntime = undefined;
    this.runtimeInitialization = undefined;
  }

  async initialize(): Promise<void> {
    await this.ensureRuntimeReady();
  }

  isReady(): boolean {
    return (
      this.options.profileStore.isReady() &&
      this.getRuntimeDiagnostic().status === 'ready'
    );
  }

  getRuntimeDiagnostic(): BrowserRuntimeDiagnostic {
    return (
      this.resolvedRuntime?.diagnostic ?? {
        message: 'Browser runtime has not been initialized',
        preferredKind: this.runtimeConfig.kind,
        status: 'pending',
      }
    );
  }

  async executeRequest(
    request: BrowserRuntimeRequest,
  ): Promise<BrowserRuntimeResponse> {
    return this.execute(toHostCommand(request));
  }

  async execute(command: BrowserHostCommand): Promise<BrowserRuntimeResponse> {
    return this.runQueued(() => this.executeObserved(command));
  }

  private async executeObserved(
    command: BrowserHostCommand,
  ): Promise<BrowserRuntimeResponse> {
    const startedAt = Date.now();
    this.recordObservability({
      details: {
        command: command.command,
        commandId: String(command.commandId),
        profileName: command.profileName,
        siteId: command.siteId,
        ...observabilityDetailsFromMetadata(command.observability),
      },
      event: 'browser.command_received',
      message: 'Browser host received command',
    });

    const result = withCommandObservability(
      command,
      await this.executeUnqueued(command),
    );
    const durationMs = Math.max(0, Date.now() - startedAt);
    if ('error' in result) {
      this.recordObservability({
        details: {
          command: command.command,
          commandId: String(command.commandId),
          durationMs,
          outcome: 'error',
          profileName: command.profileName,
          reasonCode: result.error.data?.code,
          siteId: command.siteId,
          ...observabilityDetailsFromMetadata(command.observability),
        },
        event: 'browser.command_failed',
        level: 'warn',
        message: 'Browser host command failed',
      });
      return result;
    }

    const detectionKind = result.result.detection.kind;
    this.recordObservability({
      details: {
        command: command.command,
        commandId: String(command.commandId),
        detectionKind,
        durationMs,
        outcome: detectionKind === 'ok' ? 'success' : 'blocked',
        profileName: command.profileName,
        siteId: command.siteId,
        ...observabilityDetailsFromMetadata(command.observability),
      },
      event: 'browser.command_completed',
      level: detectionKind === 'ok' ? 'info' : 'warn',
      message: 'Browser host command completed',
    });
    if (detectionKind !== 'ok') {
      this.recordObservability({
        details: {
          command: command.command,
          commandId: String(command.commandId),
          detectionKind,
          profileName: command.profileName,
          siteId: command.siteId,
          ...observabilityDetailsFromMetadata(command.observability),
        },
        event: 'browser.detection',
        level: 'warn',
        message: 'Browser host detected access problem',
      });
    }
    return result;
  }

  private async executeUnqueued(
    command: BrowserHostCommand,
  ): Promise<BrowserRuntimeResponse> {
    try {
      await this.cleanupExpiredSessions();
      await this.ensureRuntimeReady();
      if (!this.isReady()) {
        return this.error(
          command,
          'BROWSER_HOST_NOT_READY',
          this.getRuntimeDiagnostic().message,
        );
      }
      return await this.executeOrThrow(command);
    } catch (error) {
      return this.error(
        command,
        'BROWSER_COMMAND_FAILED',
        error instanceof Error ? error.message : 'Browser command failed',
      );
    }
  }

  private runQueued<T>(task: () => Promise<T>): Promise<T> {
    const previous = this.queue;
    let release: () => void = () => undefined;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    return previous
      .catch(() => undefined)
      .then(task)
      .finally(release);
  }

  private async executeOrThrow(
    command: BrowserHostCommand,
  ): Promise<BrowserRuntimeResponse> {
    if (command.command === 'browser.capturePage') {
      return this.capturePage(
        command as BrowserHostCommand<'browser.capturePage'>,
      );
    }
    if (command.command === 'browser.verifyProfile') {
      return this.verifyProfile(
        command as BrowserHostCommand<'browser.verifyProfile'>,
      );
    }
    if (command.command === 'browser.openLogin') {
      return this.openLogin(command as BrowserHostCommand<'browser.openLogin'>);
    }
    if (command.command === 'browser.clearProfile') {
      return this.clearProfile(
        command as BrowserHostCommand<'browser.clearProfile'>,
      );
    }
    if (command.command === 'browser.createSession') {
      return this.createSession(
        command as BrowserHostCommand<'browser.createSession'>,
      );
    }
    if (command.command === 'browser.runActions') {
      return this.runActions(
        command as BrowserHostCommand<'browser.runActions'>,
      );
    }
    if (command.command === 'browser.closeSession') {
      return this.closeSession(
        command as BrowserHostCommand<'browser.closeSession'>,
      );
    }
    return this.error(
      command,
      'UNSUPPORTED_BROWSER_COMMAND',
      'Unsupported browser command',
    );
  }

  private async createSession(
    command: BrowserHostCommand<'browser.createSession'>,
  ): Promise<BrowserRuntimeResponse> {
    if (this.browserSessions.has(command.sessionId)) {
      return this.error(
        command,
        'BROWSER_SESSION_DUPLICATE',
        'Browser session already exists',
        { sessionId: command.sessionId },
      );
    }
    const profileCheck = await this.requireProfileIfNeeded(command);
    if (profileCheck) {
      return profileCheck as BrowserRuntimeResponse<'browser.createSession'>;
    }

    const createdAt = this.now().toISOString();
    const expiresAt = command.expiresAt ?? addMilliseconds(this.now(), 900_000);
    const { context, page, close } = await this.createSessionContext(command);
    this.browserSessions.set(command.sessionId, {
      close,
      context,
      createdAt,
      expiresAt,
      lastUsedAt: createdAt,
      page,
      profileName: command.profileName,
      sessionId: command.sessionId,
      siteId: command.siteId,
    });

    return createBrowserRuntimeSuccessResponse<'browser.createSession'>(
      command.commandId,
      {
        capturedAt: createdAt,
        detection: { kind: 'ok' },
        session: {
          createdAt,
          expiresAt,
          ...(command.profileName ? { profileName: command.profileName } : {}),
          sessionId: command.sessionId,
          siteId: command.siteId,
        },
        sessionId: command.sessionId,
      },
    );
  }

  private async runActions(
    command: BrowserHostCommand<'browser.runActions'>,
  ): Promise<BrowserRuntimeResponse> {
    const session = this.browserSessions.get(command.sessionId);
    if (!session) {
      return this.error(
        command,
        'BROWSER_SESSION_NOT_FOUND',
        'Browser session was not found',
        { sessionId: command.sessionId },
      );
    }
    if (isExpired(session.expiresAt, this.now())) {
      await this.closeBrowserSession(session.sessionId);
      return this.error(
        command,
        'BROWSER_SESSION_EXPIRED',
        'Browser session has expired',
        { sessionId: command.sessionId },
      );
    }

    const actionResults: BrowserActionResult[] = [];
    for (const [index, action] of command.actions.entries()) {
      try {
        actionResults.push(
          await this.executeSessionAction(session.page, action),
        );
      } catch (error) {
        session.lastUsedAt = this.now().toISOString();
        return this.error(
          command,
          'BROWSER_ACTION_FAILED',
          error instanceof Error ? error.message : 'Browser action failed',
          {
            failedActionIndex: index,
            failedActionType: action.type,
            sessionId: command.sessionId,
          },
        );
      }
    }
    session.lastUsedAt = this.now().toISOString();

    return createBrowserRuntimeSuccessResponse<'browser.runActions'>(
      command.commandId,
      {
        actionResults,
        capturedAt: session.lastUsedAt,
        detection: { kind: 'ok' },
        sessionId: command.sessionId,
      },
    );
  }

  private async closeSession(
    command: BrowserHostCommand<'browser.closeSession'>,
  ): Promise<BrowserRuntimeResponse> {
    await this.closeBrowserSession(command.sessionId);
    return createBrowserRuntimeSuccessResponse<'browser.closeSession'>(
      command.commandId,
      {
        capturedAt: this.now().toISOString(),
        detection: { kind: 'ok' },
        sessionId: command.sessionId,
      },
    );
  }

  private async capturePage(
    command: BrowserHostCommand<'browser.capturePage'>,
  ): Promise<BrowserRuntimeResponse<'browser.capturePage'>> {
    if (!command.url) {
      return this.error(
        command,
        'INVALID_BROWSER_COMMAND',
        'Capture command requires a URL',
      );
    }
    const url = command.url;
    const profileCheck = await this.requireProfileIfNeeded(command);
    if (profileCheck) {
      return profileCheck;
    }

    return this.withContext(command, async (context) => {
      if (command.blockResources?.length) {
        const blocked = new Set<string>(command.blockResources);
        await context.route('**/*', (route) => routeResource(route, blocked));
      }
      const page = await context.newPage();
      const response = await page.goto(url, {
        timeout: command.timeoutMs,
        waitUntil: command.waitUntil ?? 'domcontentloaded',
      });
      const html = command.includeHtml ? await page.content() : undefined;
      const text = command.includeText
        ? ((await page.locator('body').textContent()) ?? '')
        : undefined;
      const screenshot = command.includeScreenshot
        ? await page.screenshot({ fullPage: true })
        : undefined;
      const detection = detectAccessProblem(page.url(), text ?? html);
      if (
        command.authPolicy === 'required' &&
        command.profileName &&
        detection.kind === 'login_required'
      ) {
        await this.options.profileStore.markStatus(
          command.siteId,
          command.profileName,
          'expired',
        );
        this.notifyStateChanged();
      }
      return createBrowserRuntimeSuccessResponse(command.commandId, {
        capturedAt: this.now().toISOString(),
        detection,
        finalUrl: page.url(),
        ...(html !== undefined
          ? { html: capPayload(html, this.maxPayloadBytes) }
          : {}),
        ...(screenshot !== undefined
          ? {
              screenshotBase64: capPayload(
                screenshot.toString('base64'),
                this.maxPayloadBytes,
              ),
            }
          : {}),
        ...(response?.status() !== undefined
          ? { status: response.status() }
          : {}),
        ...(text !== undefined
          ? { text: capPayload(text, this.maxPayloadBytes) }
          : {}),
        title: await page.title(),
      });
    });
  }

  private async verifyProfile(
    command: BrowserHostCommand<'browser.verifyProfile'>,
  ): Promise<BrowserRuntimeResponse<'browser.verifyProfile'>> {
    if (!command.profileName || !command.verifyUrl) {
      return this.error(
        command,
        'INVALID_BROWSER_COMMAND',
        'Verify command requires profileName and verifyUrl',
      );
    }
    const profileName = command.profileName;
    return this.withPersistentContext(command, async (context) => {
      const verification = await verifyProfileInContext(command, context);
      const profile = await this.options.profileStore.saveProfile(
        command.siteId,
        profileName,
        {
          displayName: verification.displayName,
          externalUserId: verification.externalUserId,
          status: verification.status,
          verifiedAt:
            verification.status === 'verified'
              ? this.now().toISOString()
              : undefined,
        },
      );
      this.notifyStateChanged();
      return createBrowserRuntimeSuccessResponse(command.commandId, {
        capturedAt: this.now().toISOString(),
        detection: verification.detection,
        finalUrl: verification.finalUrl,
        profile: this.options.profileStore.toPublicProfile(profile),
        ...(verification.response?.status() !== undefined
          ? { status: verification.response.status() }
          : {}),
        title: verification.title,
      });
    });
  }

  private async openLogin(
    command: BrowserHostCommand<'browser.openLogin'>,
  ): Promise<BrowserRuntimeResponse<'browser.openLogin'>> {
    if (!command.profileName || !command.loginUrl) {
      return this.error(
        command,
        'INVALID_BROWSER_COMMAND',
        'Login command requires profileName and loginUrl',
      );
    }
    const key = profileKey(command.siteId, command.profileName);
    await this.closeLoginContext(key);
    const context = await this.launchPersistentContext(command, {
      headless: false,
    });
    this.loginContexts.set(key, context);
    this.watchLoginContextClose(key, command, context);
    const page = await context.newPage();
    const navigation = await safeGoto(page, command.loginUrl, {
      timeout: command.timeoutMs,
      waitUntil: command.waitUntil ?? 'domcontentloaded',
    });
    await this.options.profileStore.saveProfile(
      command.siteId,
      command.profileName,
      {
        displayName: undefined,
        externalUserId: undefined,
        status: 'login_required',
        verifiedAt: undefined,
      },
    );
    this.notifyStateChanged();
    return createBrowserRuntimeSuccessResponse(command.commandId, {
      capturedAt: this.now().toISOString(),
      detection: navigation.error
        ? { kind: 'blocked', reason: navigation.error }
        : { kind: 'login_required' },
      finalUrl: page.url(),
      ...(navigation.response?.status() !== undefined
        ? { status: navigation.response.status() }
        : {}),
      title: await page.title(),
    });
  }

  private async launchPersistentContext(
    command: BrowserHostCommand,
    options: { readonly headless?: boolean } = {},
  ): Promise<RuntimeContext> {
    if (!command.profileName) {
      throw new Error('Persistent context requires profileName');
    }
    const profileDir = this.options.profileStore.profileDir(
      command.siteId,
      command.profileName,
    );
    await mkdir(profileDir, { recursive: true });
    return this.runtime.launchPersistentContext(profileDir, {
      ...this.activeRuntimeLaunchOptions(),
      headless: options.headless ?? this.headless,
    });
  }

  private async createSessionContext(
    command: BrowserHostCommand<'browser.createSession'>,
  ): Promise<{
    readonly context: RuntimeContext;
    readonly page: RuntimePage;
    readonly close: () => Promise<void>;
  }> {
    if (command.authPolicy === 'required') {
      const context = await this.launchPersistentContext(command);
      if (command.blockResources?.length) {
        const blocked = new Set<string>(command.blockResources);
        await context.route('**/*', (route) => routeResource(route, blocked));
      }
      return {
        context,
        page: await context.newPage(),
        close: () => context.close(),
      };
    }

    const browser = await this.runtime.launch({
      ...this.activeRuntimeLaunchOptions(),
      headless: this.headless,
    });
    const context = await browser.newContext();
    if (command.blockResources?.length) {
      const blocked = new Set<string>(command.blockResources);
      await context.route('**/*', (route) => routeResource(route, blocked));
    }
    return {
      context,
      page: await context.newPage(),
      close: async () => {
        await context.close();
        await browser.close();
      },
    };
  }

  private async closeLoginContext(key: string): Promise<void> {
    const context = this.loginContexts.get(key);
    if (!context) {
      return;
    }
    this.loginContexts.delete(key);
    this.suppressedLoginContextCloses.add(key);
    try {
      await context.close();
    } finally {
      this.suppressedLoginContextCloses.delete(key);
    }
  }

  private async clearProfile(
    command: BrowserHostCommand<'browser.clearProfile'>,
  ): Promise<BrowserRuntimeResponse<'browser.clearProfile'>> {
    if (!command.profileName) {
      return this.error(
        command,
        'INVALID_BROWSER_COMMAND',
        'Clear command requires profileName',
      );
    }
    await this.closeLoginContext(
      profileKey(command.siteId, command.profileName),
    );
    await this.options.profileStore.clearProfile(
      command.siteId,
      command.profileName,
    );
    this.notifyStateChanged();
    return createBrowserRuntimeSuccessResponse(command.commandId, {
      capturedAt: this.now().toISOString(),
      detection: { kind: 'login_required' },
    });
  }

  private async requireProfileIfNeeded(
    command: BrowserHostCommand,
  ): Promise<BrowserRuntimeResponse | undefined> {
    if (command.authPolicy !== 'required') {
      return undefined;
    }
    if (!command.profileName) {
      return this.error(
        command,
        'AUTH_PROFILE_REQUIRED',
        'Profile name is required',
        'missing',
      );
    }
    const profile = await this.options.profileStore.getProfile(
      command.siteId,
      command.profileName,
    );
    if (!profile || profile.status !== 'verified') {
      return this.error(
        command,
        profile?.status === 'expired'
          ? 'AUTH_PROFILE_EXPIRED'
          : 'AUTH_PROFILE_REQUIRED',
        'Required browser profile is not verified',
        profile?.status ?? 'missing',
      );
    }
    return undefined;
  }

  private async withContext<T>(
    command: BrowserHostCommand,
    callback: (context: RuntimeContext) => Promise<T>,
  ): Promise<T> {
    if (command.authPolicy === 'required') {
      return this.withPersistentContext(command, callback);
    }

    let browser: RuntimeBrowser | undefined;
    try {
      browser = await this.runtime.launch({
        ...this.activeRuntimeLaunchOptions(),
        headless: this.headless,
      });
      const context = await browser.newContext();
      return await callback(context);
    } finally {
      await browser?.close();
    }
  }

  private async withPersistentContext<T>(
    command: BrowserHostCommand,
    callback: (context: RuntimeContext) => Promise<T>,
  ): Promise<T> {
    await this.closeLoginContext(
      profileKey(command.siteId, command.profileName),
    );
    const context = await this.launchPersistentContext(command);
    try {
      return await callback(context);
    } finally {
      await context.close();
    }
  }

  private error(
    command: BrowserHostCommand,
    code: BrowserRuntimeErrorCode,
    message: string,
    details?:
      | RuntimeBrowserProfileStatus
      | {
          readonly failedActionIndex?: number;
          readonly failedActionType?: BrowserAction['type'];
          readonly profileStatus?: RuntimeBrowserProfileStatus;
          readonly sessionId?: string;
        },
  ): BrowserRuntimeResponse {
    const profileStatus =
      typeof details === 'string' ? details : details?.profileStatus;
    return createBrowserRuntimeErrorResponse(command.commandId, {
      code,
      message,
      ...(profileStatus ? { profileStatus } : {}),
      ...(typeof details === 'object' && details.failedActionIndex !== undefined
        ? { failedActionIndex: details.failedActionIndex }
        : {}),
      ...(typeof details === 'object' && details.failedActionType
        ? { failedActionType: details.failedActionType }
        : {}),
      ...(typeof details === 'object' && details.sessionId
        ? { sessionId: details.sessionId }
        : {}),
      challenge: toChallenge(command, code, message, profileStatus),
    });
  }

  private async executeSessionAction(
    page: RuntimePage,
    action: BrowserAction,
  ): Promise<BrowserActionResult> {
    if (action.type === 'goto') {
      const response = await page.goto(action.url, {
        timeout: action.timeoutMs,
        waitUntil: action.waitUntil ?? 'domcontentloaded',
      });
      return {
        actionId: action.actionId,
        finalUrl: page.url(),
        ...(response?.status() !== undefined
          ? { status: response.status() }
          : {}),
        type: action.type,
      };
    }
    if (action.type === 'waitForSelector') {
      await page
        .locator(action.selector)
        .waitFor({ timeout: action.timeoutMs });
      return { actionId: action.actionId, type: action.type };
    }
    if (action.type === 'click') {
      await page.locator(action.selector).click({ timeout: action.timeoutMs });
      return { actionId: action.actionId, type: action.type };
    }
    if (action.type === 'fill') {
      await page
        .locator(action.selector)
        .fill(action.value, { timeout: action.timeoutMs });
      return { actionId: action.actionId, type: action.type };
    }
    if (action.type === 'textContent') {
      return {
        actionId: action.actionId,
        text: capPayload(
          (await page.locator(action.selector).textContent()) ?? '',
          this.maxPayloadBytes,
        ),
        type: action.type,
      };
    }
    if (action.type === 'content') {
      return {
        actionId: action.actionId,
        html: capPayload(await page.content(), this.maxPayloadBytes),
        type: action.type,
      };
    }
    if (action.type === 'title') {
      return {
        actionId: action.actionId,
        title: await page.title(),
        type: action.type,
      };
    }
    if (action.type === 'screenshot') {
      const screenshot = await page.screenshot({
        fullPage: action.fullPage ?? true,
      });
      return {
        actionId: action.actionId,
        screenshotBase64: capPayload(
          screenshot.toString('base64'),
          this.maxPayloadBytes,
        ),
        type: action.type,
      };
    }
    throw new Error('Unsupported browser action');
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = this.now();
    for (const session of this.browserSessions.values()) {
      if (isExpired(session.expiresAt, now)) {
        await this.closeBrowserSession(session.sessionId);
      }
    }
  }

  private async closeBrowserSession(sessionId: string): Promise<void> {
    const session = this.browserSessions.get(sessionId);
    if (!session) {
      return;
    }
    this.browserSessions.delete(sessionId);
    await session.close();
  }

  private watchLoginContextClose(
    key: string,
    command: BrowserHostCommand,
    context: RuntimeContext,
  ): void {
    if (!context.on || !command.profileName || !command.verifyUrl) {
      return;
    }
    context.on('close', () => {
      if (this.suppressedLoginContextCloses.has(key)) {
        return;
      }
      if (this.loginContexts.get(key) === context) {
        this.loginContexts.delete(key);
      }
      void this.runQueued(() =>
        this.verifyProfile({
          ...command,
          command: 'browser.verifyProfile',
          commandId: `${command.commandId}:verify-on-close`,
        }),
      );
    });
  }

  private notifyStateChanged(): void {
    void this.stateChanged?.();
  }

  private async ensureRuntimeReady(): Promise<void> {
    if (this.resolvedRuntime) {
      return;
    }
    this.runtimeInitialization ??= this.resolveRuntime().then((resolved) => {
      this.resolvedRuntime = resolved;
      this.runtimeInitialization = undefined;
    });
    await this.runtimeInitialization;
  }

  private async resolveRuntime(): Promise<ResolvedBrowserRuntime> {
    const hostLaunchOptions = this.runtimeConfig.executablePath
      ? { executablePath: this.runtimeConfig.executablePath }
      : { channel: 'chrome' };
    const result = await this.tryRuntimeCandidate(
      'host-chrome',
      hostLaunchOptions,
    );
    if (result.ok) {
      this.recordObservability({
        details: {
          browserRuntimeMessage:
            'Using host Google Chrome for browser automation',
          runtimeStatus: 'ready',
        },
        event: 'browser.runtime_ready',
        message: 'Browser runtime is ready',
      });
      return {
        diagnostic: {
          activeKind: 'host-chrome',
          message: 'Using host Google Chrome for browser automation',
          preferredKind: 'host-chrome',
          status: 'ready',
        },
        launchOptions: hostLaunchOptions,
      };
    }

    this.recordObservability({
      details: {
        browserRuntimeMessage: result.message,
        outcome: 'unavailable',
        reasonCode: 'BROWSER_RUNTIME_UNAVAILABLE',
        runtimeStatus: 'unavailable',
      },
      event: 'browser.runtime_unavailable',
      level: 'warn',
      message: 'Browser runtime is unavailable',
    });
    return {
      diagnostic: {
        message: `Host Google Chrome is unavailable: ${result.message}`,
        preferredKind: 'host-chrome',
        status: 'unavailable',
      },
      launchOptions: hostLaunchOptions,
    };
  }

  private async tryRuntimeCandidate(
    kind: DesktopBrowserRuntime['kind'],
    launchOptions: Omit<RuntimeLaunchOptions, 'headless'>,
  ): Promise<RuntimeValidationResult> {
    return this.runtimeValidator({
      kind,
      launchOptions,
      runtime: this.runtime,
    });
  }

  private activeRuntimeLaunchOptions(): Omit<RuntimeLaunchOptions, 'headless'> {
    if (this.resolvedRuntime?.diagnostic.status !== 'ready') {
      throw new Error(this.getRuntimeDiagnostic().message);
    }
    return this.resolvedRuntime.launchOptions;
  }

  private recordObservability(input: {
    readonly details?: Parameters<
      typeof createDesktopObservabilityEvent
    >[0]['details'];
    readonly event: DesktopObservabilityEventName;
    readonly level?: DesktopObservabilityLevel;
    readonly message: string;
  }): void {
    this.options.observability?.record(
      createDesktopObservabilityEvent({
        details: {
          agentId: this.options.agentId,
          ...input.details,
        },
        event: input.event,
        level: input.level,
        message: input.message,
        now: this.now,
      }),
    );
  }
}

async function validateRuntimeLaunch({
  launchOptions,
  runtime,
}: {
  readonly kind: DesktopBrowserRuntime['kind'];
  readonly launchOptions: Omit<RuntimeLaunchOptions, 'headless'>;
  readonly runtime: ChromiumRuntime;
}): Promise<RuntimeValidationResult> {
  let browser: RuntimeBrowser | undefined;
  try {
    browser = await runtime.launch({ ...launchOptions, headless: true });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : 'Browser runtime unavailable',
    };
  } finally {
    await browser?.close();
  }
}

function profileKey(siteId: string, profileName: string | undefined): string {
  return `${siteId}:${profileName ?? ''}`;
}

function toHostCommand(request: BrowserRuntimeRequest): BrowserHostCommand {
  return {
    ...(request.params as BrowserRuntimeParamsByMethod[BrowserRuntimeMethod]),
    command: request.method,
    commandId: request.id,
    observability: request.observability,
  } as BrowserHostCommand;
}

function withCommandObservability(
  command: BrowserHostCommand,
  response: BrowserRuntimeResponse,
): BrowserRuntimeResponse {
  return command.observability
    ? { ...response, observability: command.observability }
    : response;
}

function toChallenge(
  command: BrowserHostCommand,
  code: BrowserRuntimeErrorCode,
  message: string,
  profileStatus?: RuntimeBrowserProfileStatus,
): BrowserChallenge | undefined {
  if (code === 'AUTH_PROFILE_REQUIRED' || profileStatus === 'missing') {
    return {
      kind: 'login_required',
      siteId: command.siteId,
      profileName: command.profileName,
      loginUrl: command.loginUrl,
      verifyUrl: command.verifyUrl,
      message,
      retryable: true,
    };
  }
  if (code === 'AUTH_PROFILE_EXPIRED' || profileStatus === 'expired') {
    return {
      kind: 'login_expired',
      siteId: command.siteId,
      profileName: command.profileName,
      loginUrl: command.loginUrl,
      verifyUrl: command.verifyUrl,
      message,
      retryable: true,
    };
  }
  if (profileStatus === 'blocked') {
    return {
      kind: 'blocked',
      siteId: command.siteId,
      profileName: command.profileName,
      loginUrl: command.loginUrl,
      verifyUrl: command.verifyUrl,
      message,
      retryable: false,
    };
  }
  return undefined;
}

async function verifyProfileInContext(
  command: BrowserHostCommand,
  context: RuntimeContext,
): Promise<ProfileVerificationResult> {
  const verifier = profileVerifiers.get(command.siteId);
  return verifier
    ? verifier({ command, context })
    : verifyGenericProfile({ command, context });
}

async function verifyGenericProfile({
  command,
  context,
}: {
  readonly command: BrowserHostCommand;
  readonly context: RuntimeContext;
}): Promise<ProfileVerificationResult> {
  const page = await context.newPage();
  const navigation = await safeGoto(page, command.verifyUrl ?? '', {
    timeout: command.timeoutMs,
    waitUntil: command.waitUntil ?? 'domcontentloaded',
  });
  if (navigation.error) {
    return {
      detection: { kind: 'blocked', reason: navigation.error },
      finalUrl: page.url(),
      response: navigation.response,
      status: 'blocked',
      title: await page.title(),
    };
  }
  const text = (await page.locator('body').textContent()) ?? '';
  const detection = detectAccessProblem(page.url(), text);
  return {
    detection,
    finalUrl: page.url(),
    response: navigation.response,
    status: detection.kind === 'ok' ? 'verified' : 'login_required',
    title: await page.title(),
  };
}

async function verifyDoubanProfile({
  command,
  context,
}: {
  readonly command: BrowserHostCommand;
  readonly context: RuntimeContext;
}): Promise<ProfileVerificationResult> {
  const page = await context.newPage();
  const navigationOptions = {
    timeout: command.timeoutMs,
    waitUntil: command.waitUntil ?? ('domcontentloaded' as const),
  };
  const homeNavigation = await safeGoto(
    page,
    'https://www.douban.com/',
    navigationOptions,
  );
  if (homeNavigation.error) {
    return {
      detection: { kind: 'blocked', reason: homeNavigation.error },
      finalUrl: page.url(),
      response: homeNavigation.response,
      status: 'blocked',
      title: await page.title(),
    };
  }

  const homeText = (await page.locator('body').textContent()) ?? '';
  const homeHtml = await page.content();
  const homeDetection = detectAccessProblem(
    page.url(),
    `${homeText}\n${homeHtml}`,
  );
  const displayName = extractDoubanAccountDisplayName(homeHtml, homeText);
  if (!displayName) {
    const blockedDetection = isBlockedDetection(homeDetection)
      ? homeDetection
      : undefined;
    return {
      detection:
        blockedDetection ??
        ({
          kind: 'login_required',
          reason: 'Douban account menu was not found',
        } satisfies BrowserDetection),
      finalUrl: page.url(),
      response: homeNavigation.response,
      status: blockedDetection ? 'blocked' : 'login_required',
      title: await page.title(),
    };
  }

  const mineNavigation = await safeGoto(
    page,
    'https://www.douban.com/mine/',
    navigationOptions,
  );
  const externalUserId = mineNavigation.error
    ? undefined
    : extractDoubanExternalUserId(page.url());
  return {
    detection: mineNavigation.error
      ? {
          kind: 'ok',
          reason: `Douban account menu verified; mine page unavailable: ${mineNavigation.error}`,
        }
      : { kind: 'ok' },
    displayName,
    externalUserId,
    finalUrl: page.url(),
    response: mineNavigation.response ?? homeNavigation.response,
    status: 'verified',
    title: await page.title(),
  };
}

function detectAccessProblem(finalUrl: string, content: string | undefined) {
  const normalizedFinalUrl = finalUrl.toLowerCase();
  const normalizedContent = (content ?? '').toLowerCase();
  if (
    normalizedContent.includes('captcha') ||
    normalizedContent.includes('验证码')
  ) {
    return { kind: 'captcha_required' as const };
  }
  if (
    normalizedContent.includes('rate limit') ||
    normalizedContent.includes('too many requests')
  ) {
    return { kind: 'rate_limited' as const };
  }
  if (
    normalizedContent.includes('access denied') ||
    normalizedContent.includes('forbidden') ||
    normalizedContent.includes('异常访问') ||
    normalizedContent.includes('访问异常')
  ) {
    return { kind: 'blocked' as const };
  }
  if (
    normalizedFinalUrl.includes('/passport/login') ||
    normalizedFinalUrl.includes('/accounts/login') ||
    normalizedFinalUrl.includes('/login?') ||
    normalizedFinalUrl.includes('/signin') ||
    normalizedContent.includes('please sign in') ||
    normalizedContent.includes('sign in to continue') ||
    normalizedContent.includes('请先登录') ||
    normalizedContent.includes('请登录后') ||
    normalizedContent.includes('登录后继续') ||
    normalizedContent.includes('账号密码登录')
  ) {
    return { kind: 'login_required' as const };
  }
  return { kind: 'ok' as const };
}

function isBlockedDetection(detection: BrowserDetection): boolean {
  return (
    detection.kind === 'blocked' ||
    detection.kind === 'captcha_required' ||
    detection.kind === 'rate_limited'
  );
}

function extractDoubanAccountDisplayName(
  html: string,
  bodyText: string,
): string | undefined {
  if (!/accounts\.douban\.com\/passport\/setting\/?/i.test(html)) {
    return undefined;
  }
  const anchorMatch = html.match(
    /<a\b[^>]*href=["'][^"']*accounts\.douban\.com\/passport\/setting\/?[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
  );
  const anchorText = anchorMatch ? stripHtml(anchorMatch[1] ?? '') : undefined;
  return (
    extractDoubanAccountName(anchorText) ?? extractDoubanAccountName(bodyText)
  );
}

function extractDoubanAccountName(
  text: string | undefined,
): string | undefined {
  const normalized = text?.replace(/\s+/g, ' ').trim();
  const match = normalized?.match(/(.{1,64}?)的账号/);
  return match?.[1]?.trim() || undefined;
}

function extractDoubanExternalUserId(finalUrl: string): string | undefined {
  const match = finalUrl.match(/\/people\/([^/?#]+)\/?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function safeGoto(
  page: RuntimePage,
  url: string,
  options: {
    readonly timeout?: number;
    readonly waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  },
): Promise<{
  readonly error?: string;
  readonly response?: RuntimeResponse | null;
}> {
  try {
    return { response: await page.goto(url, options) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Navigation failed',
    };
  }
}

function capPayload(value: string, maxBytes: number): string {
  return Buffer.byteLength(value, 'utf8') > maxBytes
    ? value.slice(0, maxBytes)
    : value;
}

function addMilliseconds(date: Date, milliseconds: number): string {
  return new Date(date.getTime() + milliseconds).toISOString();
}

function isExpired(expiresAt: string, now: Date): boolean {
  return Date.parse(expiresAt) <= now.getTime();
}

function routeResource(
  route: Route,
  blocked: ReadonlySet<string>,
): Promise<void> {
  return blocked.has(route.request().resourceType())
    ? route.abort()
    : route.continue();
}
