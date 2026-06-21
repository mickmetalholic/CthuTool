import type { AgentObservabilityMetadata } from '@cthutool/agent-protocol';
import type {
  BrowserDetection,
  BrowserRuntimeMethod,
} from '@cthutool/browser-runtime-protocol';

export type DesktopObservabilityLevel = 'debug' | 'info' | 'warn' | 'error';

export type DesktopObservabilityEventName =
  | 'agent.start'
  | 'agent.stop'
  | 'agent.connecting'
  | 'agent.socket_open'
  | 'agent.registered'
  | 'agent.heartbeat'
  | 'agent.reconnecting'
  | 'agent.backend_rejected'
  | 'agent.invalid_message'
  | 'agent.socket_error'
  | 'browser.command_received'
  | 'browser.command_completed'
  | 'browser.command_failed'
  | 'browser.detection'
  | 'browser.profile_check'
  | 'browser.runtime_ready'
  | 'browser.runtime_unavailable'
  | 'browser.state_changed';

export type DesktopObservabilityDetails = {
  readonly agentId?: string;
  readonly backendUrl?: string;
  readonly browserRuntimeMessage?: string;
  readonly command?: BrowserRuntimeMethod;
  readonly commandId?: string;
  readonly connectionStatus?: string;
  readonly detectionKind?: BrowserDetection['kind'];
  readonly durationMs?: number;
  readonly lastError?: string;
  readonly operation?: string;
  readonly outcome?: 'success' | 'error' | 'blocked' | 'unavailable' | 'invalid';
  readonly profileName?: string;
  readonly reasonCode?: string;
  readonly requestId?: string;
  readonly runtimeStatus?: string;
  readonly siteId?: string;
  readonly traceId?: string;
};

export type DesktopObservabilityEvent = {
  readonly event: DesktopObservabilityEventName;
  readonly level: DesktopObservabilityLevel;
  readonly details: DesktopObservabilityDetails;
  readonly message: string;
  readonly source: 'cthutool.desktop';
  readonly timestamp: string;
};

export type DesktopDiagnosticsSnapshot = {
  readonly lastError?: DesktopObservabilityEvent;
  readonly lastEvent?: DesktopObservabilityEvent;
  readonly recentEvents: readonly DesktopObservabilityEvent[];
};

export type DesktopObservabilitySink = {
  readonly record: (event: DesktopObservabilityEvent) => void;
};

export class DesktopObservabilityRecorder implements DesktopObservabilitySink {
  private readonly events: DesktopObservabilityEvent[] = [];

  constructor(
    private readonly options: {
      readonly maxEvents?: number;
      readonly now?: () => Date;
    } = {},
  ) {}

  record(event: DesktopObservabilityEvent): void {
    this.events.push({
      ...event,
      details: sanitizeObservabilityDetails(event.details),
    });
    const maxEvents = this.options.maxEvents ?? 50;
    while (this.events.length > maxEvents) {
      this.events.shift();
    }
  }

  emit(input: {
    readonly details?: DesktopObservabilityDetails;
    readonly event: DesktopObservabilityEventName;
    readonly level?: DesktopObservabilityLevel;
    readonly message: string;
  }): void {
    this.record(
      createDesktopObservabilityEvent({
        details: input.details,
        event: input.event,
        level: input.level,
        message: input.message,
        now: this.options.now,
      }),
    );
  }

  snapshot(): DesktopDiagnosticsSnapshot {
    return {
      lastError: [...this.events]
        .reverse()
        .find((event) => event.level === 'error' || event.level === 'warn'),
      lastEvent: this.events.at(-1),
      recentEvents: [...this.events].reverse().slice(0, 10),
    };
  }
}

export function createDesktopObservabilityEvent(input: {
  readonly details?: DesktopObservabilityDetails;
  readonly event: DesktopObservabilityEventName;
  readonly level?: DesktopObservabilityLevel;
  readonly message: string;
  readonly now?: () => Date;
}): DesktopObservabilityEvent {
  return {
    event: input.event,
    level: input.level ?? 'info',
    details: sanitizeObservabilityDetails(input.details ?? {}),
    message: input.message,
    source: 'cthutool.desktop',
    timestamp: (input.now ?? (() => new Date()))().toISOString(),
  };
}

export function observabilityDetailsFromMetadata(
  observability: AgentObservabilityMetadata | undefined,
): DesktopObservabilityDetails {
  if (!observability) {
    return {};
  }
  return {
    commandId:
      observability.commandId === undefined
        ? undefined
        : String(observability.commandId),
    operation: observability.operation,
    requestId: observability.requestId,
    traceId: observability.traceId,
  };
}

export function sanitizeObservabilityDetails(
  details: DesktopObservabilityDetails,
): DesktopObservabilityDetails {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as DesktopObservabilityDetails;
}
