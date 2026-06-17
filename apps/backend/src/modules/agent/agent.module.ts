import { Module } from '@nestjs/common';
import { AgentCommandGatewayModule } from './command-gateway/agent-command-gateway.module';
import { AgentRegistryModule } from './registry/agent-registry.module';
import { AgentWebSocketModule } from './websocket/agent-websocket.module';

@Module({
  imports: [
    AgentRegistryModule,
    AgentWebSocketModule,
    AgentCommandGatewayModule,
  ],
  exports: [
    AgentRegistryModule,
    AgentWebSocketModule,
    AgentCommandGatewayModule,
  ],
})
export class AgentModule {}
