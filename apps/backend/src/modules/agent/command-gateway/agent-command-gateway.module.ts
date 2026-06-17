import { Module } from '@nestjs/common';
import { AgentRegistryModule } from '../registry/agent-registry.module';
import { AgentWebSocketModule } from '../websocket/agent-websocket.module';
import { AgentCommandGateway } from './agent-command-gateway.service';

@Module({
  imports: [AgentRegistryModule, AgentWebSocketModule],
  exports: [AgentCommandGateway],
  providers: [AgentCommandGateway],
})
export class AgentCommandGatewayModule {}
