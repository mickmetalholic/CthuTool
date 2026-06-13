import type { BrowserStateSnapshotPayload } from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
import type { BrowserPendingAuthTask } from './browser-automation.types';
import type { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
import type { BrowserProfileRegistryService } from './browser-profile-registry.service';

@Injectable()
export class BrowserStateProjectionService {
  constructor(
    private readonly profiles: BrowserProfileRegistryService,
    private readonly pendingAuthTasks: BrowserPendingAuthTaskService,
  ) {}

  replaceAgentSnapshot(
    agentId: string,
    snapshot: BrowserStateSnapshotPayload,
  ): void {
    this.profiles.replaceForAgent(
      agentId,
      snapshot.profiles.map((profile) => ({
        ...profile,
        agentId,
      })),
    );
    this.pendingAuthTasks.replaceForAgent(
      agentId,
      snapshot.pendingAuthTasks.map(
        (task): BrowserPendingAuthTask => ({
          ...task,
          agentId,
          id: `${agentId}:${task.siteId}:${task.profileName}`,
        }),
      ),
    );
  }
}
