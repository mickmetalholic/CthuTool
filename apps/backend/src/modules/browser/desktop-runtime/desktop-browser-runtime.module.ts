import { Module } from '@nestjs/common';
import { AgentCommandGatewayModule } from '../../agent/command-gateway/agent-command-gateway.module';
import { DesktopBrowserRuntimeService } from './desktop-browser-runtime.service';

@Module({
  imports: [AgentCommandGatewayModule],
  exports: [DesktopBrowserRuntimeService],
  providers: [DesktopBrowserRuntimeService],
})
export class DesktopBrowserRuntimeModule {}
