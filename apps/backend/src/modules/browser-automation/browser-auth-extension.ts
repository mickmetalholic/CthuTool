import { BrowserAutomationError } from './browser-automation.errors';
import { assertProfileName } from './browser-auth-state.store';
import type { BrowserAuthBundle } from './browser-automation.types';

export type BrowserExtensionOriginStorage = {
  readonly localStorage: readonly {
    readonly name: string;
    readonly value: string;
  }[];
  readonly origin: string;
};

export type BrowserExtensionAuthSnapshot = {
  readonly allowedOrigins?: readonly string[];
  readonly cookies: readonly unknown[];
  readonly createdAt?: string;
  readonly loginUrl?: string;
  readonly originStorage: readonly BrowserExtensionOriginStorage[];
  readonly profileName: string;
  readonly updatedAt?: string;
  readonly verifyUrl?: string;
};

export function createBrowserExtensionAuthBundle(
  snapshot: BrowserExtensionAuthSnapshot,
): BrowserAuthBundle {
  assertExtensionSnapshot(snapshot);
  const updatedAt = snapshot.updatedAt ?? new Date().toISOString();

  return {
    meta: {
      allowedOrigins: snapshot.allowedOrigins,
      createdAt: snapshot.createdAt,
      loginUrl: snapshot.loginUrl,
      profileName: snapshot.profileName,
      source: 'browser-extension',
      updatedAt,
      verifyUrl: snapshot.verifyUrl,
    },
    storageState: {
      cookies: snapshot.cookies,
      origins: snapshot.originStorage.map((entry) => ({
        localStorage: entry.localStorage,
        origin: entry.origin,
      })),
    },
  };
}

function assertExtensionSnapshot(
  snapshot: BrowserExtensionAuthSnapshot,
): void {
  assertProfileName(snapshot.profileName);
  if (!Array.isArray(snapshot.cookies)) {
    throwInvalidExtensionSnapshot('cookies must be an array');
  }
  if (!Array.isArray(snapshot.originStorage)) {
    throwInvalidExtensionSnapshot('originStorage must be an array');
  }
  for (const entry of snapshot.originStorage) {
    if (
      typeof entry.origin !== 'string' ||
      !/^https?:\/\//.test(entry.origin) ||
      !Array.isArray(entry.localStorage)
    ) {
      throwInvalidExtensionSnapshot(
        'originStorage entries must include an HTTP(S) origin and localStorage array',
      );
    }
  }
}

function throwInvalidExtensionSnapshot(message: string): never {
  throw new BrowserAutomationError('INVALID_AUTH_BUNDLE', message);
}
