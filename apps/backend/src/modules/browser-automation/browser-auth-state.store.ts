import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { BrowserAutomationError } from './browser-automation.errors';
import type {
  BrowserAuthBundle,
  BrowserAuthBundleMeta,
  BrowserProfileStatus,
  BrowserStorageState,
} from './browser-automation.types';

export type BrowserAuthStateStoreOptions = {
  readonly authStateDir: string;
};

@Injectable()
export class BrowserAuthStateStore {
  constructor(
    private readonly options: BrowserAuthStateStoreOptions = {
      authStateDir: './data/secrets/browser-auth',
    },
  ) {}

  async hasProfile(profileName: string): Promise<boolean> {
    try {
      await this.readStorageState(profileName);
      return true;
    } catch (error) {
      if (
        error instanceof BrowserAutomationError &&
        error.code === 'AUTH_STATE_MISSING'
      ) {
        return false;
      }
      throw error;
    }
  }

  async readStorageState(profileName: string): Promise<BrowserStorageState> {
    assertProfileName(profileName);
    const raw = await this.readProfileFile(profileName, 'storage-state.json');
    return parseStorageState(raw);
  }

  async writeBundle(
    profileName: string,
    bundle: BrowserAuthBundle,
  ): Promise<void> {
    try {
      assertProfileName(profileName);
      assertBundleShape(bundle);
      if (bundle.meta.profileName !== profileName) {
        throwInvalidBundle('Bundle profileName does not match target profile');
      }
      parseStorageState(JSON.stringify(bundle.storageState));
      parseMeta(JSON.stringify(bundle.meta));
    } catch (error) {
      if (error instanceof BrowserAutomationError) {
        throw error.code === 'INVALID_AUTH_BUNDLE'
          ? error
          : new BrowserAutomationError('INVALID_AUTH_BUNDLE', error.message);
      }
      throw error;
    }

    const profileDir = this.profilePath(profileName);
    await mkdir(profileDir, { recursive: true });
    await writeFile(
      join(profileDir, 'storage-state.json'),
      `${JSON.stringify(bundle.storageState, null, 2)}\n`,
      'utf8',
    );
    await writeFile(
      join(profileDir, 'meta.json'),
      `${JSON.stringify(bundle.meta, null, 2)}\n`,
      'utf8',
    );
  }

  async clearProfile(profileName: string): Promise<void> {
    assertProfileName(profileName);
    await rm(this.profilePath(profileName), { force: true, recursive: true });
  }

  async getProfileStatus(profileName: string): Promise<BrowserProfileStatus> {
    assertProfileName(profileName);
    try {
      const meta = parseMeta(
        await this.readProfileFile(profileName, 'meta.json'),
      );
      await this.readStorageState(profileName);
      return {
        profileName,
        source: meta.source,
        status: 'available',
        updatedAt: meta.updatedAt,
      };
    } catch (error) {
      if (
        error instanceof BrowserAutomationError &&
        error.code === 'AUTH_STATE_MISSING'
      ) {
        return { profileName, status: 'missing' };
      }
      if (
        error instanceof BrowserAutomationError &&
        error.code === 'INVALID_AUTH_BUNDLE'
      ) {
        return { profileName, status: 'invalid' };
      }
      throw error;
    }
  }

  private async readProfileFile(
    profileName: string,
    fileName: string,
  ): Promise<string> {
    try {
      return await readFile(
        join(this.profilePath(profileName), fileName),
        'utf8',
      );
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        throw new BrowserAutomationError(
          'AUTH_STATE_MISSING',
          `Browser auth profile "${profileName}" does not exist`,
        );
      }
      throw error;
    }
  }

  private profilePath(profileName: string): string {
    return join(this.options.authStateDir, profileName);
  }
}

export function assertProfileName(profileName: string): void {
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(profileName)) {
    throwInvalidBundle(`Invalid browser auth profile name "${profileName}"`);
  }
}

function parseStorageState(raw: string): BrowserStorageState {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throwInvalidBundle('storage-state.json is not valid JSON');
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    !Array.isArray((value as { cookies?: unknown }).cookies) ||
    !Array.isArray((value as { origins?: unknown }).origins)
  ) {
    throwInvalidBundle(
      'storage-state.json must include cookies and origins arrays',
    );
  }
  return value as BrowserStorageState;
}

function assertBundleShape(bundle: BrowserAuthBundle): void {
  if (
    typeof bundle !== 'object' ||
    bundle === null ||
    typeof (bundle as { meta?: unknown }).meta !== 'object' ||
    (bundle as { meta?: unknown }).meta === null ||
    typeof (bundle as { storageState?: unknown }).storageState !== 'object' ||
    (bundle as { storageState?: unknown }).storageState === null
  ) {
    throwInvalidBundle(
      'auth bundle must include meta and storageState objects',
    );
  }
}

function parseMeta(raw: string): BrowserAuthBundleMeta {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throwInvalidBundle('meta.json is not valid JSON');
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as { profileName?: unknown }).profileName !== 'string' ||
    !['cli-helper', 'browser-extension', 'manual'].includes(
      String((value as { source?: unknown }).source),
    ) ||
    typeof (value as { updatedAt?: unknown }).updatedAt !== 'string'
  ) {
    throwInvalidBundle(
      'meta.json must include profileName, source, and updatedAt',
    );
  }
  return value as BrowserAuthBundleMeta;
}

function throwInvalidBundle(message: string): never {
  throw new BrowserAutomationError('INVALID_AUTH_BUNDLE', message);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
