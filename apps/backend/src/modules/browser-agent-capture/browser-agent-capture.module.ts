import { Module } from '@nestjs/common';
import { AgentCommandGatewayModule } from '../agent-command-gateway/agent-command-gateway.module';
import { BrowserAuthModule } from '../browser-auth/browser-auth.module';
import { AgentBrowserCaptureProvider } from './agent-browser-capture.provider';
import { BROWSER_CAPTURE_PROVIDER } from './browser-agent-capture.tokens';

@Module({
  imports: [AgentCommandGatewayModule, BrowserAuthModule],
  exports: [AgentBrowserCaptureProvider, BROWSER_CAPTURE_PROVIDER],
  providers: [
    AgentBrowserCaptureProvider,
    {
      provide: BROWSER_CAPTURE_PROVIDER,
      useExisting: AgentBrowserCaptureProvider,
    },
  ],
})
export class BrowserAgentCaptureModule {}
