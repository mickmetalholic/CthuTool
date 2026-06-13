import { Module } from '@nestjs/common';
import { AgentRegistryController } from './agent-registry.controller';
import { AgentRegistryLogger } from './agent-registry.logger';
import { AgentRegistryService } from './agent-registry.service';
import { AgentWebSocketServer } from './agent-websocket.server';

@Module({
  controllers: [AgentRegistryController],
  providers: [AgentRegistryLogger, AgentRegistryService, AgentWebSocketServer],
  exports: [AgentRegistryService, AgentWebSocketServer],
})
export class AgentRegistryModule {}
