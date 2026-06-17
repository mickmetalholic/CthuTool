import { Module } from '@nestjs/common';
import { AgentRegistryModule } from '../registry/agent-registry.module';
import { AgentWebSocketServer } from './agent-websocket.server';

@Module({
  imports: [AgentRegistryModule],
  providers: [AgentWebSocketServer],
  exports: [AgentWebSocketServer],
})
export class AgentWebSocketModule {}
