import { Injectable } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentBrowserPendingAuthTaskService } from '../agent-state/agent-browser-pending-auth-task.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentBrowserProfileRegistryService } from '../agent-state/agent-browser-profile-registry.service';
import type {
  AgentBrowserPendingAuthTask,
  AgentBrowserProfile,
  UpsertAgentBrowserPendingAuthTaskInput,
} from '../agent-state/agent-state.types';

@Injectable()
export class BrowserAuthService {
  constructor(
    private readonly profiles: AgentBrowserProfileRegistryService,
    private readonly pendingAuthTasks: AgentBrowserPendingAuthTaskService,
  ) {}

  listProfiles(): AgentBrowserProfile[] {
    return this.profiles.list();
  }

  listPendingAuthTasks(): AgentBrowserPendingAuthTask[] {
    return this.pendingAuthTasks.list();
  }

  reportProfile(profile: AgentBrowserProfile): AgentBrowserProfile {
    const updated = this.profiles.upsert(profile);
    if (updated.status === 'verified') {
      this.pendingAuthTasks.resolve(
        updated.agentId,
        updated.siteId,
        updated.profileName,
      );
    }
    return updated;
  }

  reportPendingAuthTask(
    input: UpsertAgentBrowserPendingAuthTaskInput,
  ): AgentBrowserPendingAuthTask {
    return this.pendingAuthTasks.upsert(input);
  }

  resolvePendingAuthTask(
    agentId: string,
    siteId: string,
    profileName: string,
  ): void {
    this.pendingAuthTasks.resolve(agentId, siteId, profileName);
  }
}
