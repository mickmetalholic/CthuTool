import { Module } from '@nestjs/common';
import { AgentRegistryModule } from '../agent-registry/agent-registry.module';
import { AgentBrowserPendingAuthTaskService } from './agent-browser-pending-auth-task.service';
import { AgentBrowserProfileRegistryService } from './agent-browser-profile-registry.service';
import { AgentStateProjectionService } from './agent-state-projection.service';
import { AgentStateSnapshotListener } from './agent-state-snapshot-listener';

@Module({
  imports: [AgentRegistryModule],
  exports: [
    AgentBrowserPendingAuthTaskService,
    AgentBrowserProfileRegistryService,
    AgentStateProjectionService,
  ],
  providers: [
    AgentBrowserPendingAuthTaskService,
    AgentBrowserProfileRegistryService,
    AgentStateProjectionService,
    AgentStateSnapshotListener,
  ],
})
export class AgentStateModule {}
