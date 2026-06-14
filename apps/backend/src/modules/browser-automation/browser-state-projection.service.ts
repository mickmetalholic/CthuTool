import type { BrowserStateSnapshotPayload } from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
import type { BrowserPendingAuthTask } from './browser-automation.types';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserProfileRegistryService } from './browser-profile-registry.service';

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
