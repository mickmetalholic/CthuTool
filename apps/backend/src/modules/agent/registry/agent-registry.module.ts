import { Module } from '@nestjs/common';
import { OperatorAccessModule } from '../../operator-access/operator-access.module';
import { AgentLifecycleEvents } from './agent-lifecycle-events.service';
import { AgentRegistryController } from './agent-registry.controller';
import { AgentRegistryLogger } from './agent-registry.logger';
import { AgentRegistryService } from './agent-registry.service';

@Module({
  imports: [OperatorAccessModule],
  controllers: [AgentRegistryController],
  providers: [AgentLifecycleEvents, AgentRegistryLogger, AgentRegistryService],
  exports: [AgentLifecycleEvents, AgentRegistryService, AgentRegistryLogger],
})
export class AgentRegistryModule {}
