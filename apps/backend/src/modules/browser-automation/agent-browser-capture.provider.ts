import { randomUUID } from 'node:crypto';
import {
  BROWSER_CAPABILITY,
  type BrowserErrorMessage,
  type BrowserResultMessage,
} from '@cthutool/agent-protocol';
import { Injectable } from '@nestjs/common';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import {
  AgentCommandGateway,
  AgentCommandGatewayError,
} from '../agent-command-gateway/agent-command-gateway.service';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BrowserAuthService } from '../browser-auth/browser-auth.service';
import { BrowserAutomationError } from './browser-automation.errors';
import type {
  BrowserCaptureProvider,
  BrowserCaptureRequest,
  BrowserCaptureSnapshot,
} from './browser-automation.types';

@Injectable()
export class AgentBrowserCaptureProvider implements BrowserCaptureProvider {
  constructor(
    private readonly commandGateway: AgentCommandGateway,
    private readonly browserAuth: BrowserAuthService,
  ) {}

  async capturePage(
    request: BrowserCaptureRequest,
  ): Promise<BrowserCaptureSnapshot> {
    const agent =
      this.commandGateway.selectAgentByCapability(BROWSER_CAPABILITY);
    if (!agent) {
      throw new BrowserAutomationError(
        'AGENT_NOT_AVAILABLE',
        'No online desktop agent with browser capability',
      );
    }

    let response: BrowserResultMessage | BrowserErrorMessage;
    try {
      response = await this.commandGateway.sendBrowserCommand(
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
        error instanceof AgentCommandGatewayError
          ? error.message
          : 'Browser-capable desktop agent is not available',
      );
    }

    if (response.type === 'browser.error') {
      this.recordPendingAuth(agent.agentId, request, response);
      throw new BrowserAutomationError(
        mapBrowserErrorCode(response),
        response.payload.message,
        {
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
  ): BrowserCaptureSnapshot {
    if (response.payload.profile) {
      this.browserAuth.reportProfile(response.payload.profile);
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
    request: BrowserCaptureRequest,
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
    this.browserAuth.reportPendingAuthTask({
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
) {
  if (profileStatus === 'expired') {
    return 'expired';
  }
  if (profileStatus === 'blocked') {
    return 'blocked';
  }
  return 'missing';
}
