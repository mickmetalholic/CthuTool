import type { BrowserStateSnapshotPayload } from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentBrowserPendingAuthTaskService } from './agent-browser-pending-auth-task.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentBrowserProfileRegistryService } from './agent-browser-profile-registry.service';

@Injectable()
export class AgentStateProjectionService {
  constructor(
    private readonly profiles: AgentBrowserProfileRegistryService,
    private readonly pendingAuthTasks: AgentBrowserPendingAuthTaskService,
  ) {}

  replaceBrowserSnapshot(
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
      snapshot.pendingAuthTasks.map((task) => ({
        ...task,
        agentId,
        id: `${agentId}:${task.siteId}:${task.profileName}`,
      })),
    );
  }
}
