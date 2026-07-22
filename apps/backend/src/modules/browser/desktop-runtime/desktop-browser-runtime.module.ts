import { Module } from '@nestjs/common';
import { AgentCommandGatewayModule } from '../../agent/command-gateway/agent-command-gateway.module';
import { OperatorAccessModule } from '../../operator-access/operator-access.module';
import { DesktopBrowserRuntimeService } from './desktop-browser-runtime.service';

@Module({
  imports: [AgentCommandGatewayModule, OperatorAccessModule],
  exports: [DesktopBrowserRuntimeService],
  providers: [DesktopBrowserRuntimeService],
})
export class DesktopBrowserRuntimeModule {}
