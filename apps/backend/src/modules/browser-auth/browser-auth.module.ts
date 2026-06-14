import { Module } from '@nestjs/common';
import { AgentCommandGatewayModule } from '../agent-command-gateway/agent-command-gateway.module';
import { AgentStateModule } from '../agent-state/agent-state.module';
import { SitesConfigModule } from '../sites-config/sites-config.module';
import { AgentBrowserAuthProvider } from './agent-browser-auth.provider';
import { BrowserAuthService } from './browser-auth.service';
import { BROWSER_AUTH_PROVIDER } from './browser-auth.tokens';

@Module({
  imports: [AgentCommandGatewayModule, AgentStateModule, SitesConfigModule],
  exports: [BrowserAuthService],
  providers: [
    AgentBrowserAuthProvider,
    BrowserAuthService,
    {
      provide: BROWSER_AUTH_PROVIDER,
      useExisting: AgentBrowserAuthProvider,
    },
  ],
})
export class BrowserAuthModule {}
