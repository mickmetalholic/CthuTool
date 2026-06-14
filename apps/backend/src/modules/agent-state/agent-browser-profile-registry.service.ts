import { Injectable } from '@nestjs/common';
import type {
  AgentBrowserProfile,
  AgentBrowserProfileStatus,
} from './agent-state.types';

@Injectable()
export class AgentBrowserProfileRegistryService {
  private readonly profiles = new Map<string, AgentBrowserProfile>();

  upsert(profile: AgentBrowserProfile): AgentBrowserProfile {
    const publicProfile = copyProfile(profile);
    this.profiles.set(
      profileKey(
        publicProfile.agentId,
        publicProfile.siteId,
        publicProfile.profileName,
      ),
      publicProfile,
    );
    return copyProfile(publicProfile);
  }

  replaceForAgent(
    agentId: string,
    profiles: readonly AgentBrowserProfile[],
  ): AgentBrowserProfile[] {
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
  ): AgentBrowserProfile | undefined {
    const profile = this.profiles.get(profileKey(agentId, siteId, profileName));
    return profile ? copyProfile(profile) : undefined;
  }

  list(): AgentBrowserProfile[] {
    return [...this.profiles.values()].map(copyProfile);
  }

  toAuthStatus(
    agentId: string,
    siteId: string,
    profileName: string,
  ): AgentBrowserProfileStatus {
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

function copyProfile(profile: AgentBrowserProfile): AgentBrowserProfile {
  const copy: AgentBrowserProfile = {
    agentId: profile.agentId,
    profileName: profile.profileName,
    siteId: profile.siteId,
    status: profile.status,
    updatedAt: profile.updatedAt,
  };

  if (profile.displayName !== undefined) {
    copy.displayName = profile.displayName;
  }
  if (profile.externalUserId !== undefined) {
    copy.externalUserId = profile.externalUserId;
  }
  if (profile.verifiedAt !== undefined) {
    copy.verifiedAt = profile.verifiedAt;
  }

  return copy;
}
