import { mkdir } from 'node:fs/promises';
import type {
  BrowserCommandPayload,
  BrowserErrorMessage,
  BrowserResultMessage,
} from '@cthutool/agent-protocol';
import {
  createBrowserErrorMessage,
  createBrowserResultMessage,
} from '@cthutool/agent-protocol';
import type { Route } from 'playwright';
import { chromium } from 'playwright';
import type { BrowserProfileStore } from './browser-profile-store';
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

type ChromiumRuntime = {
  readonly launch: (options: {
    readonly headless: boolean;
  }) => Promise<RuntimeBrowser>;
  readonly launchPersistentContext: (
    userDataDir: string,
    options: { readonly headless: boolean },
  ) => Promise<RuntimeContext>;
};

export type PlaywrightHostOptions = {
  readonly agentId: string;
  readonly headless?: boolean;
  readonly maxPayloadBytes?: number;
  readonly profileStore: BrowserProfileStore;
  readonly pendingAuthTasks: PendingAuthTaskStore;
  readonly runtime?: ChromiumRuntime;
  readonly now?: () => Date;
  readonly onStateChanged?: () => void | Promise<void>;
};

export class PlaywrightHost {
  private readonly runtime: ChromiumRuntime;
  private readonly headless: boolean;
  private readonly maxPayloadBytes: number;
  private readonly now: () => Date;
  private readonly loginContexts = new Map<string, RuntimeContext>();
  private readonly suppressedLoginContextCloses = new Set<string>();
  private stateChanged?: () => void | Promise<void>;
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly options: PlaywrightHostOptions) {
    this.runtime = (options.runtime ?? chromium) as ChromiumRuntime;
    this.headless = options.headless ?? true;
    this.maxPayloadBytes = options.maxPayloadBytes ?? 2_000_000;
    this.now = options.now ?? (() => new Date());
    this.stateChanged = options.onStateChanged;
  }

  setStateChangedCallback(callback: () => void | Promise<void>): void {
    this.stateChanged = callback;
  }

  isReady(): boolean {
    return this.options.profileStore.isReady();
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
      if (!this.isReady()) {
        return this.error(
          command,
          'BROWSER_HOST_NOT_READY',
          'Browser host is not ready',
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
        const blocked = new Set(command.blockResources);
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
    const verifyUrl = command.verifyUrl;
    return this.withPersistentContext(command, async (context) => {
      const page = await context.newPage();
      const response = await page.goto(verifyUrl, {
        timeout: command.timeoutMs,
        waitUntil: command.waitUntil ?? 'domcontentloaded',
      });
      const text = (await page.locator('body').textContent()) ?? '';
      const detection = detectAccessProblem(page.url(), text);
      const status = detection.kind === 'ok' ? 'verified' : 'login_required';
      const profile = await this.options.profileStore.markStatus(
        command.siteId,
        profileName,
        status,
      );
      if (status === 'verified') {
        this.options.pendingAuthTasks.resolve(command.siteId, profileName);
      } else {
        this.options.pendingAuthTasks.upsert({
          profileName,
          reason: 'verification_failed',
          siteId: command.siteId,
          source: 'runtime_failure',
        });
      }
      this.notifyStateChanged();
      return createBrowserResultMessage({
        capturedAt: this.now().toISOString(),
        command: command.command,
        commandId: command.commandId,
        detection,
        finalUrl: page.url(),
        profile: this.options.profileStore.toPublicProfile(
          this.options.agentId,
          profile,
        ),
        ...(response?.status() !== undefined
          ? { status: response.status() }
          : {}),
        title: await page.title(),
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
    const context = await this.launchPersistentContext(command);
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
      { status: 'login_required' },
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
      headless: this.headless,
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
    const profile = await this.options.profileStore.getProfile(
      command.siteId,
      command.profileName,
    );
    if (!profile || profile.status !== 'verified') {
      this.options.pendingAuthTasks.upsert({
        loginUrl: command.loginUrl,
        profileName: command.profileName,
        reason: profile?.status === 'expired' ? 'expired' : 'missing',
        siteId: command.siteId,
        source: 'backend_request',
        verifyUrl: command.verifyUrl,
      });
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
      browser = await this.runtime.launch({ headless: this.headless });
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
}

function profileKey(siteId: string, profileName: string | undefined): string {
  return `${siteId}:${profileName ?? ''}`;
}

function detectAccessProblem(finalUrl: string, content: string | undefined) {
  const haystack = `${finalUrl}\n${content ?? ''}`.toLowerCase();
  if (
    haystack.includes('/login') ||
    haystack.includes('/signin') ||
    haystack.includes('登录') ||
    haystack.includes('sign in')
  ) {
    return { kind: 'login_required' as const };
  }
  if (haystack.includes('captcha') || haystack.includes('验证码')) {
    return { kind: 'captcha_required' as const };
  }
  if (
    haystack.includes('rate limit') ||
    haystack.includes('too many requests')
  ) {
    return { kind: 'rate_limited' as const };
  }
  return { kind: 'ok' as const };
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
