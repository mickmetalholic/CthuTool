import { randomUUID } from 'node:crypto';
import {
  BROWSER_CAPABILITY,
  type BrowserAction,
  type BrowserChallenge,
  type BrowserResourceType,
  type BrowserRuntimeErrorData,
  type BrowserRuntimeMethod,
  type BrowserRuntimeParamsByMethod,
  type BrowserRuntimeResponse,
  type BrowserRuntimeResultByMethod,
  createBrowserRuntimeRequest,
  validateBrowserRuntimeResponse,
} from '@cthutool/browser-runtime-protocol';
import { Injectable, Optional } from '@nestjs/common';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import {
  BackendObservabilityService,
  currentObservabilityMetadata,
} from '../../../observability';
// Nest DI needs runtime class references; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import {
  AgentCommandGateway,
  AgentCommandGatewayError,
} from '../../agent/command-gateway/agent-command-gateway.service';
import type {
  DesktopBrowserCaptureResult,
  DesktopBrowserProfileStatus,
  DesktopBrowserRunActionsResult,
  DesktopBrowserRuntimeDiagnostics,
  DesktopBrowserRuntimeResult,
  DesktopBrowserRuntimeStatus,
  DesktopBrowserSessionMetadata,
  InteractionChallenge,
  InteractionChallengeReason,
} from './desktop-browser-runtime.types';

@Injectable()
export class DesktopBrowserRuntimeService {
  constructor(
    private readonly commandGateway: AgentCommandGateway,
    @Optional()
    private readonly observability?: BackendObservabilityService,
  ) {}

  async capturePage(options: {
    readonly url: string;
    readonly siteId?: string;
    readonly profileName?: string;
    readonly authPolicy?: 'anonymous' | 'required';
    readonly includeHtml?: boolean;
    readonly includeText?: boolean;
    readonly includeScreenshot?: boolean;
    readonly blockResources?: readonly string[];
    readonly timeoutMs?: number;
    readonly waitUntil?: 'domcontentloaded' | 'load' | 'networkidle';
    readonly loginUrl?: string;
    readonly verifyUrl?: string;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserCaptureResult>> {
    const response = await this.sendBrowserRequest('browser.capturePage', {
      authPolicy: options.authPolicy ?? 'anonymous',
      blockResources: options.blockResources
        ? ([...options.blockResources] as BrowserResourceType[])
        : undefined,
      includeHtml: options.includeHtml,
      includeScreenshot: options.includeScreenshot,
      includeText: options.includeText,
      loginUrl: options.loginUrl,
      profileName: options.profileName,
      siteId: options.siteId ?? 'default',
      timeoutMs: options.timeoutMs,
      url: options.url,
      verifyUrl: options.verifyUrl,
      waitUntil: options.waitUntil,
    });
    if (!response.ok) {
      return response;
    }

    const parsed = this.parseResponse('browser.capturePage', response.value, {
      siteId: options.siteId ?? 'default',
      profileName: options.profileName,
      loginUrl: options.loginUrl,
      verifyUrl: options.verifyUrl,
    });
    if (!parsed.ok) {
      return parsed;
    }

    return {
      ok: true,
      value: {
        capturedAt: parsed.value.capturedAt,
        detection: parsed.value.detection ?? { kind: 'ok' },
        finalUrl: parsed.value.finalUrl ?? '',
        html: parsed.value.html,
        screenshotBase64: parsed.value.screenshotBase64,
        status: parsed.value.status,
        text: parsed.value.text,
        title: parsed.value.title,
      },
    };
  }

  async createSession(options: {
    readonly sessionId: string;
    readonly siteId: string;
    readonly profileName?: string;
    readonly authPolicy?: 'anonymous' | 'required';
    readonly blockResources?: readonly string[];
    readonly expiresAt: string;
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserSessionMetadata>> {
    const agent =
      this.commandGateway.selectAgentByCapability(BROWSER_CAPABILITY);
    if (!agent) {
      return {
        ok: false,
        error: 'No online desktop agent with browser capability',
        code: 'AGENT_NOT_AVAILABLE',
      };
    }
    const response = await this.sendBrowserRequestToAgent(
      agent.agentId,
      'browser.createSession',
      {
        authPolicy: options.authPolicy ?? 'anonymous',
        blockResources: options.blockResources
          ? ([...options.blockResources] as BrowserResourceType[])
          : undefined,
        expiresAt: options.expiresAt,
        profileName: options.profileName,
        sessionId: options.sessionId,
        siteId: options.siteId,
        timeoutMs: options.timeoutMs,
      },
    );
    if (!response.ok) {
      return response;
    }
    const parsed = this.parseResponse('browser.createSession', response.value, {
      siteId: options.siteId,
      profileName: options.profileName,
    });
    if (!parsed.ok) {
      return parsed;
    }
    return {
      ok: true,
      value: {
        ...parsed.value.session,
        agentId: agent.agentId,
      },
    };
  }

  async runActions(options: {
    readonly agentId: string;
    readonly sessionId: string;
    readonly siteId: string;
    readonly profileName?: string;
    readonly authPolicy?: 'anonymous' | 'required';
    readonly actions: readonly BrowserAction[];
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserRunActionsResult>> {
    const response = await this.sendBrowserRequestToAgent(
      options.agentId,
      'browser.runActions',
      {
        actions: [...options.actions],
        authPolicy: options.authPolicy ?? 'anonymous',
        profileName: options.profileName,
        sessionId: options.sessionId,
        siteId: options.siteId,
        timeoutMs: options.timeoutMs,
      },
    );
    if (!response.ok) {
      return response;
    }
    const parsed = this.parseResponse('browser.runActions', response.value, {
      siteId: options.siteId,
      profileName: options.profileName,
    });
    if (!parsed.ok) {
      return parsed;
    }
    return {
      ok: true,
      value: {
        actionResults: parsed.value.actionResults,
        capturedAt: parsed.value.capturedAt,
        sessionId: parsed.value.sessionId,
      },
    };
  }

  async closeSession(options: {
    readonly agentId: string;
    readonly sessionId: string;
    readonly siteId: string;
    readonly profileName?: string;
    readonly authPolicy?: 'anonymous' | 'required';
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<{ readonly sessionId: string }>> {
    const response = await this.sendBrowserRequestToAgent(
      options.agentId,
      'browser.closeSession',
      {
        authPolicy: options.authPolicy ?? 'anonymous',
        profileName: options.profileName,
        sessionId: options.sessionId,
        siteId: options.siteId,
        timeoutMs: options.timeoutMs,
      },
    );
    if (!response.ok) {
      return response;
    }
    const parsed = this.parseResponse('browser.closeSession', response.value, {
      siteId: options.siteId,
      profileName: options.profileName,
    });
    if (!parsed.ok) {
      return parsed;
    }
    return {
      ok: true,
      value: { sessionId: parsed.value.sessionId },
    };
  }

  async openLogin(options: {
    readonly siteId: string;
    readonly profileName: string;
    readonly loginUrl?: string;
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserProfileStatus>> {
    return this.sendProfileOperation('browser.openLogin', {
      authPolicy: 'required',
      loginUrl: options.loginUrl,
      profileName: options.profileName,
      siteId: options.siteId,
      timeoutMs: options.timeoutMs,
    });
  }

  async verifyProfile(options: {
    readonly siteId: string;
    readonly profileName: string;
    readonly verifyUrl?: string;
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserProfileStatus>> {
    return this.sendProfileOperation('browser.verifyProfile', {
      authPolicy: 'required',
      profileName: options.profileName,
      siteId: options.siteId,
      timeoutMs: options.timeoutMs,
      verifyUrl: options.verifyUrl,
    });
  }

  async getStatus(): Promise<DesktopBrowserRuntimeStatus> {
    const agent =
      this.commandGateway.selectAgentByCapability(BROWSER_CAPABILITY);
    if (!agent) {
      return {
        agentId: 'unknown',
        available: false,
      };
    }
    return {
      agentId: agent.agentId,
      available: true,
      lastSeenAt: agent.lastSeenAt,
    };
  }

  async getDiagnostics(): Promise<DesktopBrowserRuntimeDiagnostics> {
    const agent =
      this.commandGateway.selectAgentByCapability(BROWSER_CAPABILITY);
    return {
      agentId: agent?.agentId ?? 'unknown',
      online: !!agent,
      capabilities: agent?.capabilities ?? [],
      lastSeenAt: agent?.lastSeenAt,
    };
  }

  private async sendProfileOperation<
    TMethod extends 'browser.openLogin' | 'browser.verifyProfile',
  >(
    method: TMethod,
    params: BrowserRuntimeParamsByMethod[TMethod],
  ): Promise<DesktopBrowserRuntimeResult<DesktopBrowserProfileStatus>> {
    const response = await this.sendBrowserRequest(method, params);
    if (!response.ok) {
      return response;
    }

    const parsed = this.parseResponse(method, response.value, {
      siteId: params.siteId,
      profileName: params.profileName,
      loginUrl: params.loginUrl,
      verifyUrl: params.verifyUrl,
    });
    if (!parsed.ok) {
      return parsed;
    }

    const profile = parsed.value.profile;
    return {
      ok: true,
      value: {
        profileName: profile?.profileName ?? params.profileName ?? 'default',
        status: toDesktopProfileStatus(profile?.status),
        updatedAt: profile?.updatedAt,
      },
    };
  }

  private async sendBrowserRequest<TMethod extends BrowserRuntimeMethod>(
    method: TMethod,
    params: BrowserRuntimeParamsByMethod[TMethod],
  ): Promise<DesktopBrowserRuntimeResult<BrowserRuntimeResponse<TMethod>>> {
    const agent =
      this.commandGateway.selectAgentByCapability(BROWSER_CAPABILITY);
    if (!agent) {
      this.observability?.record({
        event: 'desktop_browser_runtime.unavailable',
        level: 'warn',
        details: {
          code: 'AGENT_NOT_AVAILABLE',
          operation: method,
          siteId: params.siteId,
        },
      });
      return {
        ok: false,
        error: 'No online desktop agent with browser capability',
        code: 'AGENT_NOT_AVAILABLE',
      };
    }
    return this.sendBrowserRequestToAgent(agent.agentId, method, params);
  }

  private async sendBrowserRequestToAgent<TMethod extends BrowserRuntimeMethod>(
    agentId: string,
    method: TMethod,
    params: BrowserRuntimeParamsByMethod[TMethod],
  ): Promise<DesktopBrowserRuntimeResult<BrowserRuntimeResponse<TMethod>>> {
    const startedAt = Date.now();
    try {
      const commandId = randomUUID();
      const observability = currentObservabilityMetadata({
        commandId: String(commandId),
        operation: method,
      });
      const response = await this.commandGateway.sendCommand<
        BrowserRuntimeResponse<TMethod>
      >(
        agentId,
        {
          ...createBrowserRuntimeRequest(commandId, method, params),
          observability,
        },
        params.timeoutMs,
      );
      if ('error' in response) {
        this.recordRuntimeCommand('desktop_browser_runtime.command_failed', {
          agentId,
          commandId,
          commandType: method,
          durationMs: Date.now() - startedAt,
          errorCode: response.error.data?.code ?? response.error.code,
          siteId: params.siteId,
        });
      } else {
        this.recordRuntimeCommand('desktop_browser_runtime.command_completed', {
          agentId,
          commandId,
          commandType: method,
          durationMs: Date.now() - startedAt,
          responseType: 'jsonrpc.result',
          siteId: params.siteId,
        });
      }
      return {
        ok: true,
        value: response,
      };
    } catch (error) {
      this.recordRuntimeCommand('desktop_browser_runtime.command_failed', {
        agentId,
        commandType: method,
        durationMs: Date.now() - startedAt,
        errorCode: 'AGENT_NOT_AVAILABLE',
        message:
          error instanceof Error
            ? error.message
            : 'Desktop browser runtime is not available',
        siteId: params.siteId,
      });
      return {
        ok: false,
        error:
          error instanceof AgentCommandGatewayError
            ? error.message
            : 'Desktop browser runtime is not available',
        code: 'AGENT_NOT_AVAILABLE',
      };
    }
  }

  private parseResponse<TMethod extends BrowserRuntimeMethod>(
    method: TMethod,
    response: BrowserRuntimeResponse<TMethod>,
    context: {
      readonly siteId: string;
      readonly profileName?: string;
      readonly loginUrl?: string;
      readonly verifyUrl?: string;
    },
  ): DesktopBrowserRuntimeResult<BrowserRuntimeResultByMethod[TMethod]> {
    const parsed = validateBrowserRuntimeResponse(method, response);
    if (!parsed.ok) {
      return {
        ok: false,
        error: parsed.message,
        code: 'INVALID_BROWSER_RUNTIME_RESPONSE',
      };
    }
    if ('error' in parsed.value) {
      return this.toChallengeOrError(parsed.value.error.data, context);
    }
    return {
      ok: true,
      value: parsed.value.result,
    };
  }

  private toChallengeOrError(
    error: BrowserRuntimeErrorData | undefined,
    context: {
      readonly siteId: string;
      readonly profileName?: string;
      readonly loginUrl?: string;
      readonly verifyUrl?: string;
    },
  ): DesktopBrowserRuntimeResult<never> {
    if (!error) {
      return {
        ok: false,
        error: 'Browser command failed',
        code: 'COMMAND_FAILED',
      };
    }

    const challenge = error.challenge
      ? toInteractionChallenge(error.challenge, context)
      : fallbackChallenge(error, context);
    if (challenge) {
      return {
        ok: false,
        challenge,
      };
    }

    return {
      ok: false,
      error: 'Browser command failed',
      code: error.code,
    };
  }

  private recordRuntimeCommand(
    event: string,
    details: Record<string, unknown>,
  ): void {
    this.observability?.record({
      event,
      level: event.endsWith('failed') ? 'warn' : 'info',
      details,
    });
  }
}

function toInteractionChallenge(
  challenge: BrowserChallenge,
  context: {
    readonly siteId: string;
    readonly profileName?: string;
    readonly loginUrl?: string;
    readonly verifyUrl?: string;
  },
): InteractionChallenge {
  const reason = toInteractionChallengeReason(challenge.kind);
  return {
    siteId: challenge.siteId || context.siteId,
    profileName: challenge.profileName ?? context.profileName ?? 'default',
    action: reason === 'login_required' ? 'login' : 'verify',
    reason,
    loginUrl: challenge.loginUrl ?? context.loginUrl,
    verifyUrl: challenge.verifyUrl ?? context.verifyUrl,
  };
}

function fallbackChallenge(
  error: BrowserRuntimeErrorData,
  context: {
    readonly siteId: string;
    readonly profileName?: string;
    readonly loginUrl?: string;
    readonly verifyUrl?: string;
  },
): InteractionChallenge | undefined {
  if (
    error.code === 'AUTH_PROFILE_REQUIRED' ||
    error.profileStatus === 'missing'
  ) {
    return {
      siteId: context.siteId,
      profileName: context.profileName ?? 'default',
      action: 'login',
      reason: 'login_required',
      loginUrl: context.loginUrl,
      verifyUrl: context.verifyUrl,
    };
  }

  if (
    error.code === 'AUTH_PROFILE_EXPIRED' ||
    error.code === 'BROWSER_PROFILE_EXPIRED' ||
    error.profileStatus === 'expired'
  ) {
    return {
      siteId: context.siteId,
      profileName: context.profileName ?? 'default',
      action: 'verify',
      reason: 'profile_expired',
      loginUrl: context.loginUrl,
      verifyUrl: context.verifyUrl,
    };
  }

  return undefined;
}

function toInteractionChallengeReason(
  kind: BrowserChallenge['kind'],
): InteractionChallengeReason {
  switch (kind) {
    case 'login_required':
      return 'login_required';
    case 'login_expired':
      return 'profile_expired';
    case 'verification_failed':
      return 'verification_failed';
    case 'captcha_required':
      return 'captcha_required';
    case 'blocked':
      return 'blocked';
    case 'rate_limited':
      return 'rate_limited';
  }
}

function toDesktopProfileStatus(
  status?:
    | 'missing'
    | 'login_required'
    | 'verifying'
    | 'verified'
    | 'expired'
    | 'blocked',
): DesktopBrowserProfileStatus['status'] {
  switch (status) {
    case 'verified':
      return 'available';
    case 'missing':
      return 'missing';
    case 'expired':
      return 'expired';
    case 'login_required':
    case 'verifying':
    case 'blocked':
    case undefined:
      return 'invalid';
  }
}
