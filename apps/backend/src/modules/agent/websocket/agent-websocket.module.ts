import { Module } from '@nestjs/common';
import { OperatorAccessModule } from '../../operator-access/operator-access.module';
import { AgentRegistryModule } from '../registry/agent-registry.module';
import { AgentWebSocketServer } from './agent-websocket.server';

@Module({
  imports: [AgentRegistryModule, OperatorAccessModule],
  providers: [AgentWebSocketServer],
  exports: [AgentWebSocketServer],
})
export class AgentWebSocketModule {}
