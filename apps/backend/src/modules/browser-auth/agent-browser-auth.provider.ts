import {
  BROWSER_CAPABILITY,
  type BrowserCommandPayload,
  type BrowserErrorMessage,
} from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import {
  AgentCommandGateway,
  AgentCommandGatewayError,
} from '../agent-command-gateway/agent-command-gateway.service';
import type {
  BrowserAuthProvider,
  BrowserAuthProviderResult,
} from './browser-auth.types';

@Injectable()
export class AgentBrowserAuthProvider implements BrowserAuthProvider {
  constructor(private readonly commandGateway: AgentCommandGateway) {}

  async openLogin(
    command: BrowserCommandPayload,
  ): Promise<BrowserAuthProviderResult> {
    return this.sendAuthCommand({
      ...command,
      command: 'browser.openLogin',
    });
  }

  async verifyProfile(
    command: BrowserCommandPayload,
  ): Promise<BrowserAuthProviderResult> {
    return this.sendAuthCommand({
      ...command,
      command: 'browser.verifyProfile',
    });
  }

  private async sendAuthCommand(
    command: BrowserCommandPayload,
  ): Promise<BrowserAuthProviderResult> {
    const agent =
      this.commandGateway.selectAgentByCapability(BROWSER_CAPABILITY);
    if (!agent) {
      throw new AgentCommandGatewayError(
        'AGENT_CAPABILITY_MISSING',
        'No online desktop agent with browser capability',
      );
    }

    const response = await this.commandGateway.sendBrowserCommand(
      agent.agentId,
      command,
      command.timeoutMs,
    );

    if (response.type === 'browser.error') {
      return fromBrowserError(agent.agentId, response);
    }

    const profile = response.payload.profile;
    return {
      agentId: profile?.agentId ?? agent.agentId,
      status: profile?.status ?? 'verified',
      ...(profile?.profileName ? { profileName: profile.profileName } : {}),
      ...(profile?.siteId ? { siteId: profile.siteId } : {}),
      ...(profile?.updatedAt ? { updatedAt: profile.updatedAt } : {}),
    };
  }
}

function fromBrowserError(
  agentId: string,
  response: BrowserErrorMessage,
): BrowserAuthProviderResult {
  return {
    agentId,
    status: response.payload.profileStatus ?? 'missing',
  };
}
