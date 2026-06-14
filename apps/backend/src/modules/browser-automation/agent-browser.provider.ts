import { randomUUID } from 'node:crypto';
import {
  BROWSER_CAPABILITY,
  type BrowserErrorMessage,
  type BrowserResultMessage,
} from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentRegistryService } from '../agent-registry/agent-registry.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { AgentWebSocketServer } from '../agent-registry/agent-websocket.server';
import { BrowserAutomationError } from './browser-automation.errors';
import type {
  BrowserPendingAuthReason,
  BrowserProvider,
  BrowserProviderRequest,
  BrowserProviderSnapshot,
} from './browser-automation.types';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserPendingAuthTaskService } from './browser-pending-auth-task.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserProfileRegistryService } from './browser-profile-registry.service';

@Injectable()
export class AgentBrowserProvider implements BrowserProvider {
  constructor(
    private readonly registry: AgentRegistryService,
    private readonly agentSocketServer: AgentWebSocketServer,
    private readonly profileRegistry: BrowserProfileRegistryService,
    private readonly pendingAuthTasks: BrowserPendingAuthTaskService,
  ) {}

  async capturePage(
    request: BrowserProviderRequest,
  ): Promise<BrowserProviderSnapshot> {
    const agent = this.registry
      .listOnlineAgents()
      .find((status) => status.capabilities.includes(BROWSER_CAPABILITY));
    if (!agent) {
      throw new BrowserAutomationError(
        'AGENT_NOT_AVAILABLE',
        'No online desktop agent with browser capability',
      );
    }

    let response: BrowserResultMessage | BrowserErrorMessage;
    try {
      response = await this.agentSocketServer.sendBrowserCommand(
        agent.agentId,
        {
          authPolicy:
            request.authPolicy ??
            (request.requireAuth ? 'required' : 'anonymous'),
          blockResources: request.blockResources
            ? [...request.blockResources]
            : undefined,
          command: 'browser.capturePage',
          commandId: randomUUID(),
          includeHtml: request.includeHtml,
          includeScreenshot: request.includeScreenshot,
          includeText: request.includeText,
          loginUrl: request.loginUrl,
          profileName: request.profileName,
          siteId: request.siteId ?? 'default',
          timeoutMs: request.timeoutMs,
          url: request.url,
          verifyUrl: request.verifyUrl,
          waitUntil: request.waitUntil,
        },
        request.timeoutMs,
      );
    } catch (error) {
      throw new BrowserAutomationError(
        'AGENT_NOT_AVAILABLE',
        error instanceof Error
          ? error.message
          : 'Browser-capable desktop agent is not available',
        { agentId: agent.agentId },
      );
    }

    if (response.type === 'browser.error') {
      this.recordPendingAuth(agent.agentId, request, response);
      throw new BrowserAutomationError(
        mapBrowserErrorCode(response),
        response.payload.message,
        {
          agentId: agent.agentId,
          browserCode: response.payload.code,
          profileStatus: response.payload.profileStatus,
        },
      );
    }

    return this.toSnapshot(agent.agentId, response);
  }

  private toSnapshot(
    agentId: string,
    response: BrowserResultMessage,
  ): BrowserProviderSnapshot {
    if (response.payload.profile) {
      this.profileRegistry.upsert(response.payload.profile);
      if (response.payload.profile.status === 'verified') {
        this.pendingAuthTasks.resolve(
          response.payload.profile.agentId,
          response.payload.profile.siteId,
          response.payload.profile.profileName,
        );
      }
    }

    return {
      agentId,
      detection: response.payload.detection,
      finalUrl: response.payload.finalUrl ?? '',
      html: response.payload.html,
      screenshot: response.payload.screenshotBase64
        ? Buffer.from(response.payload.screenshotBase64, 'base64')
        : undefined,
      status: response.payload.status,
      text: response.payload.text,
      title: response.payload.title,
    };
  }

  private recordPendingAuth(
    agentId: string,
    request: BrowserProviderRequest,
    response: BrowserErrorMessage,
  ): void {
    if (
      response.payload.code !== 'AUTH_PROFILE_REQUIRED' &&
      response.payload.code !== 'AUTH_PROFILE_EXPIRED'
    ) {
      return;
    }
    if (!request.siteId || !request.profileName) {
      return;
    }
    this.pendingAuthTasks.upsert({
      agentId,
      loginUrl: request.loginUrl,
      profileName: request.profileName,
      reason: mapPendingReason(response.payload.profileStatus),
      siteId: request.siteId,
      verifyUrl: request.verifyUrl,
    });
  }
}

function mapBrowserErrorCode(
  response: BrowserErrorMessage,
): BrowserAutomationError['code'] {
  if (response.payload.code === 'AUTH_PROFILE_EXPIRED') {
    return 'AUTH_PROFILE_EXPIRED';
  }
  if (response.payload.code === 'AUTH_PROFILE_REQUIRED') {
    return 'AUTH_PROFILE_REQUIRED';
  }
  return 'BROWSER_AGENT_COMMAND_FAILED';
}

function mapPendingReason(
  profileStatus: BrowserErrorMessage['payload']['profileStatus'],
): BrowserPendingAuthReason {
  if (profileStatus === 'expired') {
    return 'expired';
  }
  if (profileStatus === 'blocked') {
    return 'blocked';
  }
  return 'missing';
}
