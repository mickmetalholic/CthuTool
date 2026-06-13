import { Injectable } from '@nestjs/common';
import type {
  BrowserProfileRegistryEntry,
  BrowserProfileStatus,
} from './browser-automation.types';

@Injectable()
export class BrowserProfileRegistryService {
  private readonly profiles = new Map<string, BrowserProfileRegistryEntry>();

  upsert(profile: BrowserProfileRegistryEntry): BrowserProfileRegistryEntry {
    this.profiles.set(
      profileKey(profile.agentId, profile.siteId, profile.profileName),
      {
        ...profile,
      },
    );
    return profile;
  }

  replaceForAgent(
    agentId: string,
    profiles: readonly BrowserProfileRegistryEntry[],
  ): BrowserProfileRegistryEntry[] {
    for (const key of this.profiles.keys()) {
      if (key.startsWith(`${agentId}:`)) {
        this.profiles.delete(key);
      }
    }

    for (const profile of profiles) {
      this.upsert({
        ...profile,
        agentId,
      });
    }

    return this.list().filter((profile) => profile.agentId === agentId);
  }

  get(
    agentId: string,
    siteId: string,
    profileName: string,
  ): BrowserProfileRegistryEntry | undefined {
    const profile = this.profiles.get(profileKey(agentId, siteId, profileName));
    return profile ? { ...profile } : undefined;
  }

  list(): BrowserProfileRegistryEntry[] {
    return [...this.profiles.values()].map((profile) => ({ ...profile }));
  }

  toAuthStatus(
    agentId: string,
    siteId: string,
    profileName: string,
  ): BrowserProfileStatus {
    const profile = this.get(agentId, siteId, profileName);
    if (!profile) {
      return {
        profileName,
        status: 'missing',
      };
    }
    return {
      profileName,
      status: profile.status === 'verified' ? 'available' : 'invalid',
      updatedAt: profile.updatedAt,
    };
  }
}

function profileKey(
  agentId: string,
  siteId: string,
  profileName: string,
): string {
  return `${agentId}:${siteId}:${profileName}`;
}
