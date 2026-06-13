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
import type { BrowserProfileSummary } from '@cthutool/agent-protocol';

export type BrowserProfileStatus = BrowserProfileSummary['status'];

export type LocalBrowserProfile = Omit<BrowserProfileSummary, 'agentId'>;

export type BrowserProfilePatch = Partial<
  Pick<
    LocalBrowserProfile,
    'displayName' | 'externalUserId' | 'status' | 'verifiedAt'
  >
>;

export class BrowserProfileStore {
  constructor(
    private readonly rootDir: string,
    private readonly now: () => Date = () => new Date(),
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
    const current = await this.getProfile(siteId, profileName);
    const updatedAt = this.now().toISOString();
    const next: LocalBrowserProfile = {
      profileName,
      siteId,
      status: patch.status ?? current?.status ?? 'missing',
      updatedAt,
      ...((patch.displayName ?? current?.displayName)
        ? { displayName: patch.displayName ?? current?.displayName }
        : {}),
      ...((patch.externalUserId ?? current?.externalUserId)
        ? { externalUserId: patch.externalUserId ?? current?.externalUserId }
        : {}),
      ...((patch.verifiedAt ?? current?.verifiedAt)
        ? { verifiedAt: patch.verifiedAt ?? current?.verifiedAt }
        : {}),
    };
    await mkdir(this.profileDir(siteId, profileName), { recursive: true });
    const metaPath = this.metaPath(siteId, profileName);
    const tempMetaPath = `${metaPath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tempMetaPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    await rename(tempMetaPath, metaPath);
    return next;
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
