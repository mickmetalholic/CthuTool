import { Module } from '@nestjs/common';
import { AgentRegistryController } from './agent-registry.controller';
import { AgentRegistryLogger } from './agent-registry.logger';
import { AgentRegistryService } from './agent-registry.service';

@Module({
  controllers: [AgentRegistryController],
  providers: [AgentRegistryLogger, AgentRegistryService],
  exports: [AgentRegistryService, AgentRegistryLogger],
})
export class AgentRegistryModule {}
