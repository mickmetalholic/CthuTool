import { randomUUID } from 'node:crypto';
import {
  BROWSER_CAPABILITY,
  type BrowserAction,
  type BrowserCommandPayload,
  createBrowserCommandMessage,
} from '@cthutool/agent-protocol';
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
    const startedAt = Date.now();
    const agent =
      this.commandGateway.selectAgentByCapability(BROWSER_CAPABILITY);
    if (!agent) {
      this.observability?.record({
        event: 'desktop_browser_runtime.unavailable',
        level: 'warn',
        details: {
          code: 'AGENT_NOT_AVAILABLE',
          operation: 'browser.capturePage',
          url: options.url,
        },
      });
      return {
        ok: false,
        error: 'No online desktop agent with browser capability',
        code: 'AGENT_NOT_AVAILABLE',
      };
    }

    try {
      const commandId = randomUUID();
      const response = await this.commandGateway.sendCommand(
        agent.agentId,
        createBrowserCommand({
          authPolicy: options.authPolicy ?? 'anonymous',
          blockResources: options.blockResources
            ? ([
                ...options.blockResources,
              ] as BrowserCommandPayload['blockResources'])
            : undefined,
          command: 'browser.capturePage',
          commandId,
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
        }),
        options.timeoutMs,
      );

      if (response.type === 'browser.error') {
        this.recordRuntimeCommand('desktop_browser_runtime.command_failed', {
          agentId: agent.agentId,
          commandId,
          commandType: 'browser.capturePage',
          durationMs: Date.now() - startedAt,
          errorCode: response.payload.code,
          siteId: options.siteId,
        });
        return this.toChallengeOrError(response, {
          siteId: options.siteId ?? 'default',
          profileName: options.profileName,
          loginUrl: options.loginUrl,
          verifyUrl: options.verifyUrl,
        });
      }

      this.recordRuntimeCommand('desktop_browser_runtime.command_completed', {
        agentId: agent.agentId,
        commandId,
        commandType: 'browser.capturePage',
        detectionKind: response.payload.detection?.kind,
        durationMs: Date.now() - startedAt,
        siteId: options.siteId,
        status: response.payload.status,
      });
      return {
        ok: true,
        value: {
          capturedAt: response.payload.capturedAt,
          detection: response.payload.detection ?? { kind: 'ok' },
          finalUrl: response.payload.finalUrl ?? '',
          html: response.payload.html,
          screenshotBase64: response.payload.screenshotBase64,
          status: response.payload.status,
          text: response.payload.text,
          title: response.payload.title,
        },
      };
    } catch (error) {
      this.recordRuntimeCommand('desktop_browser_runtime.command_failed', {
        agentId: agent.agentId,
        commandType: 'browser.capturePage',
        durationMs: Date.now() - startedAt,
        errorCode: 'AGENT_NOT_AVAILABLE',
        message:
          error instanceof Error
            ? error.message
            : 'Desktop browser runtime is not available',
        siteId: options.siteId,
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

    const result = await this.sendSessionCommand<DesktopBrowserSessionMetadata>(
      agent.agentId,
      {
        authPolicy: options.authPolicy ?? 'anonymous',
        blockResources: options.blockResources
          ? ([
              ...options.blockResources,
            ] as BrowserCommandPayload['blockResources'])
          : undefined,
        command: 'browser.createSession',
        commandId: randomUUID(),
        expiresAt: options.expiresAt,
        profileName: options.profileName,
        sessionId: options.sessionId,
        siteId: options.siteId,
        timeoutMs: options.timeoutMs,
      },
      {
        siteId: options.siteId,
        profileName: options.profileName,
      },
    );
    if (!result.ok) {
      return result;
    }
    return {
      ok: true,
      value: {
        ...result.value,
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
    return this.sendSessionCommand<DesktopBrowserRunActionsResult>(
      options.agentId,
      {
        actions: [...options.actions],
        authPolicy: options.authPolicy ?? 'anonymous',
        command: 'browser.runActions',
        commandId: randomUUID(),
        profileName: options.profileName,
        sessionId: options.sessionId,
        siteId: options.siteId,
        timeoutMs: options.timeoutMs,
      },
      {
        siteId: options.siteId,
        profileName: options.profileName,
      },
    );
  }

  async closeSession(options: {
    readonly agentId: string;
    readonly sessionId: string;
    readonly siteId: string;
    readonly profileName?: string;
    readonly authPolicy?: 'anonymous' | 'required';
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<{ readonly sessionId: string }>> {
    const result = await this.sendSessionCommand<{
      readonly sessionId: string;
    }>(
      options.agentId,
      {
        authPolicy: options.authPolicy ?? 'anonymous',
        command: 'browser.closeSession',
        commandId: randomUUID(),
        profileName: options.profileName,
        sessionId: options.sessionId,
        siteId: options.siteId,
        timeoutMs: options.timeoutMs,
      },
      {
        siteId: options.siteId,
        profileName: options.profileName,
      },
    );
    if (!result.ok) {
      return result;
    }
    return {
      ok: true,
      value: { sessionId: result.value.sessionId },
    };
  }

  async openLogin(options: {
    readonly siteId: string;
    readonly profileName: string;
    readonly loginUrl?: string;
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserProfileStatus>> {
    return this.sendAuthCommand(
      {
        commandId: randomUUID(),
        command: 'browser.openLogin',
        authPolicy: 'required',
        siteId: options.siteId,
        profileName: options.profileName,
        loginUrl: options.loginUrl,
        url: options.loginUrl ?? '',
        timeoutMs: options.timeoutMs,
      },
      options,
    );
  }

  async verifyProfile(options: {
    readonly siteId: string;
    readonly profileName: string;
    readonly verifyUrl?: string;
    readonly timeoutMs?: number;
  }): Promise<DesktopBrowserRuntimeResult<DesktopBrowserProfileStatus>> {
    return this.sendAuthCommand(
      {
        commandId: randomUUID(),
        command: 'browser.verifyProfile',
        authPolicy: 'required',
        siteId: options.siteId,
        profileName: options.profileName,
        verifyUrl: options.verifyUrl,
        url: options.verifyUrl ?? '',
        timeoutMs: options.timeoutMs,
      },
      options,
    );
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

  private async sendAuthCommand(
    commandPayload: BrowserCommandPayload & { readonly commandId?: string },
    context: {
      readonly siteId: string;
      readonly profileName: string;
      readonly loginUrl?: string;
      readonly verifyUrl?: string;
    },
  ): Promise<DesktopBrowserRuntimeResult<DesktopBrowserProfileStatus>> {
    const startedAt = Date.now();
    const agent =
      this.commandGateway.selectAgentByCapability(BROWSER_CAPABILITY);
    if (!agent) {
      this.observability?.record({
        event: 'desktop_browser_runtime.unavailable',
        level: 'warn',
        details: {
          code: 'AGENT_NOT_AVAILABLE',
          operation: commandPayload.command,
          siteId: context.siteId,
        },
      });
      return {
        ok: false,
        error: 'No online desktop agent with browser capability',
        code: 'AGENT_NOT_AVAILABLE',
      };
    }

    try {
      const commandId = commandPayload.commandId ?? randomUUID();
      const response = await this.commandGateway.sendCommand(
        agent.agentId,
        createBrowserCommand({
          ...commandPayload,
          commandId,
        }),
        commandPayload.timeoutMs,
      );

      if (response.type === 'browser.error') {
        this.recordRuntimeCommand('desktop_browser_runtime.command_failed', {
          agentId: agent.agentId,
          commandId,
          commandType: commandPayload.command,
          durationMs: Date.now() - startedAt,
          errorCode: response.payload.code,
          siteId: context.siteId,
        });
        return this.toChallengeOrError(response, context);
      }

      const profile = response.payload.profile;
      this.recordRuntimeCommand('desktop_browser_runtime.command_completed', {
        agentId: agent.agentId,
        commandId,
        commandType: commandPayload.command,
        detectionKind: response.payload.detection?.kind,
        durationMs: Date.now() - startedAt,
        siteId: context.siteId,
        status: response.payload.status,
      });
      return {
        ok: true,
        value: {
          profileName: profile?.profileName ?? context.profileName,
          status:
            (profile?.status as DesktopBrowserProfileStatus['status']) ??
            'available',
          updatedAt: profile?.updatedAt,
        },
      };
    } catch (error) {
      this.recordRuntimeCommand('desktop_browser_runtime.command_failed', {
        agentId: agent.agentId,
        commandType: commandPayload.command,
        durationMs: Date.now() - startedAt,
        errorCode: 'AGENT_NOT_AVAILABLE',
        message:
          error instanceof Error
            ? error.message
            : 'Desktop browser runtime is not available',
        siteId: context.siteId,
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

  private async sendSessionCommand<
    TResult extends
      | DesktopBrowserSessionMetadata
      | DesktopBrowserRunActionsResult
      | { readonly sessionId: string },
  >(
    agentId: string,
    commandPayload: BrowserCommandPayload & { readonly commandId?: string },
    context: {
      readonly siteId: string;
      readonly profileName?: string;
      readonly loginUrl?: string;
      readonly verifyUrl?: string;
    },
  ): Promise<DesktopBrowserRuntimeResult<TResult>> {
    try {
      const response = await this.commandGateway.sendCommand(
        agentId,
        createBrowserCommand({
          ...commandPayload,
          commandId: commandPayload.commandId ?? randomUUID(),
        }),
        commandPayload.timeoutMs,
      );

      if (response.type === 'browser.error') {
        return this.toChallengeOrError(response, context);
      }

      return {
        ok: true,
        value: sessionResponseToRuntimeValue(response.payload) as TResult,
      };
    } catch (error) {
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

  private toChallengeOrError(
    response: {
      readonly payload: {
        readonly code?: string;
        readonly message?: string;
        readonly profileStatus?: string;
      };
    },
    context: {
      readonly siteId: string;
      readonly profileName?: string;
      readonly loginUrl?: string;
      readonly verifyUrl?: string;
    },
  ): DesktopBrowserRuntimeResult<never> {
    const code = response.payload.code;
    const profileStatus = response.payload.profileStatus;

    if (code === 'AUTH_PROFILE_REQUIRED' || profileStatus === 'missing') {
      return {
        ok: false,
        challenge: {
          siteId: context.siteId,
          profileName: context.profileName ?? 'default',
          action: 'login',
          reason: 'login_required',
          loginUrl: context.loginUrl,
          verifyUrl: context.verifyUrl,
        },
      };
    }

    if (code === 'AUTH_PROFILE_EXPIRED' || profileStatus === 'expired') {
      return {
        ok: false,
        challenge: {
          siteId: context.siteId,
          profileName: context.profileName ?? 'default',
          action: 'verify',
          reason: 'profile_expired',
          loginUrl: context.loginUrl,
          verifyUrl: context.verifyUrl,
        },
      };
    }

    return {
      ok: false,
      error: response.payload.message ?? 'Browser command failed',
      code: code ?? 'COMMAND_FAILED',
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

function createBrowserCommand(payload: BrowserCommandPayload) {
  const observability =
    payload.observability ??
    currentObservabilityMetadata({
      commandId: payload.commandId,
      operation: payload.command,
    });
  return {
    commandId: payload.commandId,
    observability,
    message: createBrowserCommandMessage({
      ...payload,
      observability,
    }),
  };
}

function sessionResponseToRuntimeValue(response: {
  readonly actionResults?: readonly unknown[];
  readonly capturedAt?: string;
  readonly session?: {
    readonly createdAt: string;
    readonly expiresAt: string;
    readonly profileName?: string;
    readonly sessionId: string;
    readonly siteId: string;
  };
  readonly sessionId?: string;
}) {
  if (response.session) {
    return response.session;
  }
  if (response.actionResults) {
    return {
      actionResults: response.actionResults,
      capturedAt: response.capturedAt ?? new Date().toISOString(),
      sessionId: response.sessionId ?? '',
    };
  }
  return {
    sessionId: response.sessionId ?? '',
  };
}
