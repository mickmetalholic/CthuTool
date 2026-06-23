import { mkdir } from 'node:fs/promises';
import type {
  BrowserCommandPayload,
  BrowserDetection,
  BrowserErrorMessage,
  BrowserResultMessage,
} from '@cthutool/agent-protocol';
import {
  createBrowserErrorMessage,
  createBrowserResultMessage,
} from '@cthutool/agent-protocol';
import type { Route } from 'playwright';
import { chromium } from 'playwright';
import type {
  BrowserProfileStatus,
  BrowserProfileStore,
} from './browser-profile-store';
import type { DesktopBrowserRuntime } from './config';
import type { PendingAuthTaskStore } from './pending-auth-task-store';

type RuntimeResponse = {
  readonly status: () => number;
};

type RuntimeLocator = {
  readonly textContent: () => Promise<string | null>;
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
  readonly command: BrowserCommandPayload;
  readonly context: RuntimeContext;
}) => Promise<ProfileVerificationResult>;

const profileVerifiers = new Map<string, ProfileVerifier>([
  ['douban', verifyDoubanProfile],
]);

export type PlaywrightHostOptions = {
  readonly agentId: string;
  readonly browserRuntime?: DesktopBrowserRuntime;
  readonly headless?: boolean;
  readonly maxPayloadBytes?: number;
  readonly profileStore: BrowserProfileStore;
  readonly pendingAuthTasks: PendingAuthTaskStore;
  readonly runtime?: ChromiumRuntime;
  readonly runtimeValidator?: RuntimeValidator;
  readonly now?: () => Date;
  readonly onStateChanged?: () => void | Promise<void>;
};

export class PlaywrightHost {
  private readonly runtime: ChromiumRuntime;
  private readonly runtimeValidator: RuntimeValidator;
  private readonly headless: boolean;
  private readonly maxPayloadBytes: number;
  private readonly now: () => Date;
  private readonly loginContexts = new Map<string, RuntimeContext>();
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

  async execute(
    command: BrowserCommandPayload,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
    return this.runQueued(() => this.executeUnqueued(command));
  }

  private async executeUnqueued(
    command: BrowserCommandPayload,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
    try {
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
    command: BrowserCommandPayload,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
    if (command.command === 'browser.capturePage') {
      return this.capturePage(command);
    }
    if (command.command === 'browser.verifyProfile') {
      return this.verifyProfile(command);
    }
    if (command.command === 'browser.openLogin') {
      return this.openLogin(command);
    }
    if (command.command === 'browser.clearProfile') {
      return this.clearProfile(command);
    }
    return this.error(
      command,
      'UNSUPPORTED_BROWSER_COMMAND',
      'Unsupported browser command',
    );
  }

  private async capturePage(
    command: BrowserCommandPayload,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
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
        detection.kind === 'login_required' &&
        !command.suppressPendingAuthTask
      ) {
        await this.options.profileStore.markStatus(
          command.siteId,
          command.profileName,
          'expired',
        );
        this.options.pendingAuthTasks.upsert({
          profileName: command.profileName,
          reason: 'expired',
          siteId: command.siteId,
          source: 'runtime_failure',
        });
        this.notifyStateChanged();
      }
      return createBrowserResultMessage({
        capturedAt: this.now().toISOString(),
        command: command.command,
        commandId: command.commandId,
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
    command: BrowserCommandPayload,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
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
      if (verification.status === 'verified') {
        this.options.pendingAuthTasks.resolve(command.siteId, profileName);
      } else {
        this.options.pendingAuthTasks.upsert({
          profileName,
          reason:
            verification.status === 'blocked'
              ? 'blocked'
              : 'verification_failed',
          siteId: command.siteId,
          source: 'runtime_failure',
        });
      }
      this.notifyStateChanged();
      return createBrowserResultMessage({
        capturedAt: this.now().toISOString(),
        command: command.command,
        commandId: command.commandId,
        detection: verification.detection,
        finalUrl: verification.finalUrl,
        profile: this.options.profileStore.toPublicProfile(
          this.options.agentId,
          profile,
        ),
        ...(verification.response?.status() !== undefined
          ? { status: verification.response.status() }
          : {}),
        title: verification.title,
      });
    });
  }

  private async openLogin(
    command: BrowserCommandPayload,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
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
    this.options.pendingAuthTasks.upsert({
      loginUrl: command.loginUrl,
      profileName: command.profileName,
      reason: 'missing',
      siteId: command.siteId,
      source: 'backend_request',
      verifyUrl: command.verifyUrl,
    });
    this.notifyStateChanged();
    return createBrowserResultMessage({
      capturedAt: this.now().toISOString(),
      command: command.command,
      commandId: command.commandId,
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
    command: BrowserCommandPayload,
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
    command: BrowserCommandPayload,
  ): Promise<BrowserResultMessage | BrowserErrorMessage> {
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
    this.options.pendingAuthTasks.upsert({
      profileName: command.profileName,
      reason: 'missing',
      siteId: command.siteId,
      source: 'backend_request',
    });
    this.notifyStateChanged();
    return createBrowserResultMessage({
      capturedAt: this.now().toISOString(),
      command: command.command,
      commandId: command.commandId,
      detection: { kind: 'login_required' },
    });
  }

  private async requireProfileIfNeeded(
    command: BrowserCommandPayload,
  ): Promise<BrowserErrorMessage | undefined> {
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
    if (command.suppressPendingAuthTask) {
      return undefined;
    }
    const profile = await this.options.profileStore.getProfile(
      command.siteId,
      command.profileName,
    );
    if (!profile || profile.status !== 'verified') {
      if (!command.suppressPendingAuthTask) {
        this.options.pendingAuthTasks.upsert({
          loginUrl: command.loginUrl,
          profileName: command.profileName,
          reason: profile?.status === 'expired' ? 'expired' : 'missing',
          siteId: command.siteId,
          source: 'backend_request',
          verifyUrl: command.verifyUrl,
        });
      }
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
    command: BrowserCommandPayload,
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
    command: BrowserCommandPayload,
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
    command: BrowserCommandPayload,
    code: string,
    message: string,
    profileStatus?: BrowserErrorMessage['payload']['profileStatus'],
  ): BrowserErrorMessage {
    return createBrowserErrorMessage({
      code,
      command: command.command,
      commandId: command.commandId,
      message,
      ...(profileStatus ? { profileStatus } : {}),
    });
  }

  private watchLoginContextClose(
    key: string,
    command: BrowserCommandPayload,
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

async function verifyProfileInContext(
  command: BrowserCommandPayload,
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
  readonly command: BrowserCommandPayload;
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
  readonly command: BrowserCommandPayload;
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

function routeResource(
  route: Route,
  blocked: ReadonlySet<string>,
): Promise<void> {
  return blocked.has(route.request().resourceType())
    ? route.abort()
    : route.continue();
}
