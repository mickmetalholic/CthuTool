import { existsSync } from 'node:fs';
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import type { BrowserProfileSummary } from '@cthutool/agent-protocol';

export type BrowserProfileStatus = BrowserProfileSummary['status'];

export type LocalBrowserProfile = Omit<BrowserProfileSummary, 'agentId'>;

export type BrowserProfilePatch = Partial<
  Pick<
    LocalBrowserProfile,
    'displayName' | 'externalUserId' | 'status' | 'verifiedAt'
  >
>;

type RenameFile = typeof rename;

export class BrowserProfileStore {
  private readonly saveQueues = new Map<string, Promise<void>>();

  constructor(
    private readonly rootDir: string,
    private readonly now: () => Date = () => new Date(),
    private readonly renameFile: RenameFile = rename,
  ) {}

  isReady(): boolean {
    return Boolean(this.rootDir);
  }

  profileDir(siteId: string, profileName: string): string {
    assertProfileKey(siteId, profileName);
    return join(this.rootDir, siteId, profileName);
  }

  async getProfile(
    siteId: string,
    profileName: string,
  ): Promise<LocalBrowserProfile | undefined> {
    assertProfileKey(siteId, profileName);
    const metaPath = this.metaPath(siteId, profileName);
    if (!existsSync(metaPath)) {
      return undefined;
    }
    return parseProfileMeta(await readFile(metaPath, 'utf8'));
  }

  async saveProfile(
    siteId: string,
    profileName: string,
    patch: BrowserProfilePatch,
  ): Promise<LocalBrowserProfile> {
    assertProfileKey(siteId, profileName);
    return this.enqueueSave(siteId, profileName, async () => {
      const current = await this.getProfile(siteId, profileName);
      const updatedAt = this.now().toISOString();
      const displayName =
        'displayName' in patch ? patch.displayName : current?.displayName;
      const externalUserId =
        'externalUserId' in patch
          ? patch.externalUserId
          : current?.externalUserId;
      const verifiedAt =
        'verifiedAt' in patch ? patch.verifiedAt : current?.verifiedAt;
      const next: LocalBrowserProfile = {
        profileName,
        siteId,
        status: patch.status ?? current?.status ?? 'missing',
        updatedAt,
        ...(displayName ? { displayName } : {}),
        ...(externalUserId ? { externalUserId } : {}),
        ...(verifiedAt ? { verifiedAt } : {}),
      };
      await mkdir(this.profileDir(siteId, profileName), { recursive: true });
      const metaPath = this.metaPath(siteId, profileName);
      const tempMetaPath = `${metaPath}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(
        tempMetaPath,
        `${JSON.stringify(next, null, 2)}\n`,
        'utf8',
      );
      await replaceFile(tempMetaPath, metaPath, this.renameFile);
      return next;
    });
  }

  async markStatus(
    siteId: string,
    profileName: string,
    status: BrowserProfileStatus,
  ): Promise<LocalBrowserProfile> {
    return this.saveProfile(siteId, profileName, {
      status,
      verifiedAt: status === 'verified' ? this.now().toISOString() : undefined,
    });
  }

  async listProfiles(): Promise<LocalBrowserProfile[]> {
    if (!existsSync(this.rootDir)) {
      return [];
    }
    const siteDirs = await readdir(this.rootDir, { withFileTypes: true });
    const profiles: LocalBrowserProfile[] = [];
    for (const siteDir of siteDirs) {
      if (!siteDir.isDirectory()) {
        continue;
      }
      const profileRoot = join(this.rootDir, siteDir.name);
      const profileDirs = await readdir(profileRoot, { withFileTypes: true });
      for (const profileDir of profileDirs) {
        if (!profileDir.isDirectory()) {
          continue;
        }
        const metaPath = join(
          profileRoot,
          profileDir.name,
          'profile-meta.json',
        );
        if (existsSync(metaPath)) {
          profiles.push(parseProfileMeta(await readFile(metaPath, 'utf8')));
        }
      }
    }
    return profiles.sort((left, right) =>
      `${left.siteId}:${left.profileName}`.localeCompare(
        `${right.siteId}:${right.profileName}`,
      ),
    );
  }

  async clearProfile(siteId: string, profileName: string): Promise<void> {
    assertProfileKey(siteId, profileName);
    await rm(this.profileDir(siteId, profileName), {
      force: true,
      recursive: true,
    });
  }

  toPublicProfile(
    agentId: string,
    profile: LocalBrowserProfile,
  ): BrowserProfileSummary {
    return {
      agentId,
      ...profile,
    };
  }

  private metaPath(siteId: string, profileName: string): string {
    return join(this.profileDir(siteId, profileName), 'profile-meta.json');
  }

  private async enqueueSave<T>(
    siteId: string,
    profileName: string,
    task: () => Promise<T>,
  ): Promise<T> {
    const key = `${siteId}:${profileName}`;
    const previous = this.saveQueues.get(key) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(task);
    const next = run.then(
      () => undefined,
      () => undefined,
    );
    this.saveQueues.set(key, next);
    try {
      return await run;
    } finally {
      if (this.saveQueues.get(key) === next) {
        this.saveQueues.delete(key);
      }
    }
  }
}

async function replaceFile(
  tempPath: string,
  targetPath: string,
  renameFile: RenameFile,
): Promise<void> {
  let latestError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await renameFile(tempPath, targetPath);
      return;
    } catch (error) {
      latestError = error;
      if (!isRetryableReplaceError(error) || attempt === 4) {
        break;
      }
      try {
        await rm(targetPath, { force: true });
      } catch (removeError) {
        if (!isRetryableReplaceError(removeError)) {
          latestError = removeError;
          break;
        }
      }
      await delay(20 * (attempt + 1));
    }
  }
  await rm(tempPath, { force: true });
  throw latestError;
}

function isRetryableReplaceError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = (error as NodeJS.ErrnoException).code;
  return (
    code === 'EACCES' ||
    code === 'EBUSY' ||
    code === 'EEXIST' ||
    code === 'EPERM'
  );
}

function parseProfileMeta(raw: string): LocalBrowserProfile {
  const value = JSON.parse(raw) as Partial<LocalBrowserProfile>;
  if (
    !value.siteId ||
    !value.profileName ||
    !value.status ||
    !value.updatedAt
  ) {
    throw new Error('browser profile metadata is invalid');
  }
  return value as LocalBrowserProfile;
}

export function assertProfileKey(siteId: string, profileName: string): void {
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(siteId)) {
    throw new Error(`Invalid browser site id "${siteId}"`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(profileName)) {
    throw new Error(`Invalid browser profile name "${profileName}"`);
  }
}
