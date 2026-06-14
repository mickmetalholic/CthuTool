import { Module } from '@nestjs/common';
import { AgentRegistryModule } from '../agent-registry/agent-registry.module';
import { AgentCommandGateway } from './agent-command-gateway.service';

@Module({
  imports: [AgentRegistryModule],
  exports: [AgentCommandGateway],
  providers: [AgentCommandGateway],
})
export class AgentCommandGatewayModule {}
