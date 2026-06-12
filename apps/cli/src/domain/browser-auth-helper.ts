import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type BrowserAuthStorageState = {
  readonly cookies: readonly unknown[];
  readonly origins: readonly unknown[];
};

export type BrowserAuthBundleMeta = {
  readonly profileName: string;
  readonly source: 'cli-helper' | 'browser-extension' | 'manual';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly allowedOrigins?: readonly string[];
};

export type BrowserAuthBundle = {
  readonly meta: BrowserAuthBundleMeta;
  readonly storageState: BrowserAuthStorageState;
};

export type CreateBrowserAuthBundleInput = {
  readonly allowedOrigins?: readonly string[];
  readonly loginUrl?: string;
  readonly now?: () => Date;
  readonly profileName: string;
  readonly source: BrowserAuthBundleMeta['source'];
  readonly storageState: BrowserAuthStorageState;
  readonly verifyUrl?: string;
};

export type BrowserAuthLoginInput = {
  readonly allowedOrigins?: readonly string[];
  readonly loginUrl: string;
  readonly outputRoot: string;
  readonly profileName: string;
  readonly verifyUrl?: string;
};

export type BrowserAuthLoginResult = {
  readonly metaPath: string;
  readonly profilePath: string;
  readonly storageStatePath: string;
};

export type BrowserAuthVerifyInput = {
  readonly authRoot: string;
  readonly headed?: boolean;
  readonly profileName: string;
  readonly verifyUrl?: string;
};

export type BrowserAuthVerifyUser = {
  readonly id: string;
  readonly nickname: string;
};

export type BrowserAuthVerifyResult = {
  readonly profileName: string;
  readonly user: BrowserAuthVerifyUser;
};

export type BrowserAuthLoginDeps = {
  readonly launchBrowser: () => Promise<BrowserAuthLaunchedBrowser>;
  readonly now?: () => Date;
  readonly waitForUser: () => Promise<void>;
};

export type BrowserAuthVerifyDeps = {
  readonly launchBrowser: (
    input: BrowserAuthVerifyInput & { readonly storageStatePath: string },
  ) => Promise<BrowserAuthVerifyLaunchedBrowser>;
};

export type BrowserAuthLaunchedBrowser = {
  readonly browser: {
    readonly close: () => Promise<void>;
    readonly newContext: () => Promise<BrowserAuthContext>;
  };
};

export type BrowserAuthVerifyLaunchedBrowser = {
  readonly browser: {
    readonly close: () => Promise<void>;
  };
  readonly page: {
    readonly goto: (
      url: string,
      options?: { readonly waitUntil?: 'domcontentloaded' | 'load' },
    ) => Promise<unknown>;
    readonly textContent: (selector: string) => Promise<string | null>;
    readonly title: () => Promise<string>;
    readonly url: () => string;
  };
};

export type BrowserAuthContext = {
  readonly newPage: () => Promise<{ readonly goto: (url: string) => Promise<unknown> }>;
  readonly storageState: () => Promise<BrowserAuthStorageState>;
};

export type DoubanUserIdentitySnapshot = {
  readonly finalUrl: string;
  readonly pageText?: string | null;
  readonly title?: string | null;
};

export function createBrowserAuthBundle(
  input: CreateBrowserAuthBundleInput,
): BrowserAuthBundle {
  assertProfileName(input.profileName);
  assertStorageState(input.storageState);
  const timestamp = (input.now ?? (() => new Date()))().toISOString();
  return {
    meta: {
      profileName: input.profileName,
      source: input.source,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(input.loginUrl ? { loginUrl: input.loginUrl } : {}),
      ...(input.verifyUrl ? { verifyUrl: input.verifyUrl } : {}),
      ...(input.allowedOrigins ? { allowedOrigins: input.allowedOrigins } : {}),
    },
    storageState: input.storageState,
  };
}

export async function runBrowserAuthLogin(
  input: BrowserAuthLoginInput,
  deps: BrowserAuthLoginDeps,
): Promise<BrowserAuthLoginResult> {
  const launched = await deps.launchBrowser();
  try {
    const context = await launched.browser.newContext();
    const page = await context.newPage();
    await page.goto(input.loginUrl);
    await deps.waitForUser();
    const bundle = createBrowserAuthBundle({
      allowedOrigins: input.allowedOrigins,
      loginUrl: input.loginUrl,
      now: deps.now,
      profileName: input.profileName,
      source: 'cli-helper',
      storageState: await context.storageState(),
      verifyUrl: input.verifyUrl,
    });
    return await writeBrowserAuthBundle(input.outputRoot, bundle);
  } finally {
    await launched.browser.close();
  }
}

export async function runBrowserAuthVerify(
  input: BrowserAuthVerifyInput,
  deps: BrowserAuthVerifyDeps,
): Promise<BrowserAuthVerifyResult> {
  const storageStatePath = join(
    input.authRoot,
    input.profileName,
    'storage-state.json',
  );
  const launched = await deps.launchBrowser({ ...input, storageStatePath });
  try {
    await launched.page.goto(input.verifyUrl ?? 'https://www.douban.com/mine/', {
      waitUntil: 'domcontentloaded',
    });
    const user = extractDoubanUserIdentity({
      finalUrl: launched.page.url(),
      pageText: await launched.page.textContent('body'),
      title: await launched.page.title(),
    });
    if (!user) {
      throw new Error('failed to verify Douban login');
    }
    return {
      profileName: input.profileName,
      user,
    };
  } finally {
    await launched.browser.close();
  }
}

export async function writeBrowserAuthBundle(
  outputRoot: string,
  bundle: BrowserAuthBundle,
): Promise<BrowserAuthLoginResult> {
  const profilePath = join(outputRoot, bundle.meta.profileName);
  const storageStatePath = join(profilePath, 'storage-state.json');
  const metaPath = join(profilePath, 'meta.json');
  await mkdir(profilePath, { recursive: true });
  await writeFile(
    storageStatePath,
    `${JSON.stringify(bundle.storageState, null, 2)}\n`,
    'utf8',
  );
  await writeFile(metaPath, `${JSON.stringify(bundle.meta, null, 2)}\n`, 'utf8');
  return { metaPath, profilePath, storageStatePath };
}

export function extractDoubanUserIdentity(
  snapshot: DoubanUserIdentitySnapshot,
): BrowserAuthVerifyUser | null {
  const id = snapshot.finalUrl.match(/\/people\/([^/?#]+)\/?/)?.[1];
  if (!id) {
    return null;
  }
  const titleNickname = cleanDoubanNickname(snapshot.title);
  const textNickname = cleanDoubanNickname(
    snapshot.pageText
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.endsWith('的豆瓣主页') || line.endsWith('的豆瓣')),
  );
  const nickname = titleNickname ?? textNickname;
  if (!nickname) {
    return null;
  }
  return { id, nickname };
}

function cleanDoubanNickname(value: string | null | undefined): string | null {
  const nickname = value
    ?.trim()
    .replace(/的豆瓣主页$/, '')
    .replace(/的豆瓣$/, '')
    .trim();
  return nickname && nickname.length > 0 ? nickname : null;
}

function assertStorageState(value: BrowserAuthStorageState): void {
  if (!Array.isArray(value.cookies) || !Array.isArray(value.origins)) {
    throw new Error('storage state must include cookies and origins arrays');
  }
}

function assertProfileName(profileName: string): void {
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(profileName)) {
    throw new Error(`invalid browser auth profile name: ${profileName}`);
  }
}
