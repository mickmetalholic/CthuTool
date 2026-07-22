import {
  appendFileSync,
  chmodSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import type { AgentObservabilityMetadata } from '@cthutool/agent-protocol';
import type {
  BrowserDetection,
  BrowserRuntimeMethod,
} from '@cthutool/browser-runtime-protocol';

export type AgentObservabilityLevel = 'debug' | 'info' | 'warn' | 'error';
export type AgentObservabilitySource = 'cthutool.agent' | 'cthutool.desktop';

export type AgentObservabilityEventName =
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
  | 'browser.state_changed'
  | 'runtime.state_changed'
  | 'runtime.shutdown';

export type AgentObservabilityDetails = {
  readonly agentId?: string;
  readonly backendUrl?: string;
  readonly browserRuntimeMessage?: string;
  readonly command?: BrowserRuntimeMethod;
  readonly commandId?: string;
  readonly connectionStatus?: string;
  readonly detectionKind?: BrowserDetection['kind'];
  readonly durationMs?: number;
  readonly environmentId?: string;
  readonly lastError?: string;
  readonly operation?: string;
  readonly outcome?:
    | 'success'
    | 'error'
    | 'blocked'
    | 'unavailable'
    | 'invalid';
  readonly profileName?: string;
  readonly reasonCode?: string;
  readonly requestId?: string;
  readonly runtimeStatus?: string;
  readonly siteId?: string;
  readonly traceId?: string;
};

export type AgentObservabilityEvent = {
  readonly event: AgentObservabilityEventName;
  readonly level: AgentObservabilityLevel;
  readonly details: AgentObservabilityDetails;
  readonly message: string;
  readonly source: AgentObservabilitySource;
  readonly timestamp: string;
};

export type AgentDiagnosticsSnapshot = {
  readonly lastError?: AgentObservabilityEvent;
  readonly lastEvent?: AgentObservabilityEvent;
  readonly recentEvents: readonly AgentObservabilityEvent[];
};

export type AgentObservabilitySink = {
  readonly record: (event: AgentObservabilityEvent) => void;
};

export class AgentObservabilityRecorder implements AgentObservabilitySink {
  private readonly events: AgentObservabilityEvent[] = [];
  private readonly source: AgentObservabilitySource;

  constructor(
    private readonly options: {
      readonly maxEvents?: number;
      readonly now?: () => Date;
      readonly source?: AgentObservabilitySource;
    } = {},
  ) {
    this.source = options.source ?? 'cthutool.agent';
  }

  record(event: AgentObservabilityEvent): void {
    this.events.push({
      ...event,
      details: sanitizeObservabilityDetails(event.details),
      message: sanitizeDiagnosticText(event.message),
      source: this.source,
    });
    const maxEvents = this.options.maxEvents ?? 50;
    while (this.events.length > maxEvents) {
      this.events.shift();
    }
  }

  emit(input: {
    readonly details?: AgentObservabilityDetails;
    readonly event: AgentObservabilityEventName;
    readonly level?: AgentObservabilityLevel;
    readonly message: string;
  }): void {
    this.record(
      createAgentObservabilityEvent({
        ...input,
        now: this.options.now,
        source: this.source,
      }),
    );
  }

  snapshot(): AgentDiagnosticsSnapshot {
    return {
      lastError: [...this.events]
        .reverse()
        .find((event) => event.level === 'error' || event.level === 'warn'),
      lastEvent: this.events.at(-1),
      recentEvents: [...this.events].reverse().slice(0, 10),
    };
  }
}

/** A bounded, user-private JSON-lines source for `chc agent logs`. */
export class FileAgentObservabilityRecorder
  extends AgentObservabilityRecorder
  implements AgentObservabilitySink
{
  constructor(
    private readonly fileOptions: {
      readonly path: string;
      readonly maxBytes?: number;
      readonly maxEvents?: number;
      readonly now?: () => Date;
    },
  ) {
    super({
      maxEvents: fileOptions.maxEvents,
      now: fileOptions.now,
      source: 'cthutool.agent',
    });
  }

  override record(event: AgentObservabilityEvent): void {
    const safe: AgentObservabilityEvent = {
      ...event,
      details: sanitizeObservabilityDetails(event.details),
      message: sanitizeDiagnosticText(event.message),
      source: 'cthutool.agent',
    };
    super.record(safe);
    try {
      mkdirSync(dirname(this.fileOptions.path), {
        mode: 0o700,
        recursive: true,
      });
      this.rotateIfRequired();
      appendFileSync(this.fileOptions.path, `${JSON.stringify(safe)}\n`, {
        mode: 0o600,
      });
      if (process.platform !== 'win32') {
        chmodSync(this.fileOptions.path, 0o600);
      }
    } catch {
      // Diagnostics must never interrupt Agent lifecycle or browser commands.
    }
  }

  private rotateIfRequired(): void {
    const maximum = this.fileOptions.maxBytes ?? 5 * 1024 * 1024;
    try {
      if (statSync(this.fileOptions.path).size < maximum) {
        return;
      }
      const bytes = readFileSync(this.fileOptions.path);
      writeFileSync(
        this.fileOptions.path,
        bytes.subarray(Math.max(0, bytes.length - Math.floor(maximum / 2))),
        { mode: 0o600 },
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

export class DesktopObservabilityRecorder extends AgentObservabilityRecorder {
  constructor(
    options: { readonly maxEvents?: number; readonly now?: () => Date } = {},
  ) {
    super({ ...options, source: 'cthutool.desktop' });
  }
}

export function createAgentObservabilityEvent(input: {
  readonly details?: AgentObservabilityDetails;
  readonly event: AgentObservabilityEventName;
  readonly level?: AgentObservabilityLevel;
  readonly message: string;
  readonly now?: () => Date;
  readonly source?: AgentObservabilitySource;
}): AgentObservabilityEvent {
  return {
    event: input.event,
    level: input.level ?? 'info',
    details: sanitizeObservabilityDetails(input.details ?? {}),
    message: sanitizeDiagnosticText(input.message),
    source: input.source ?? 'cthutool.agent',
    timestamp: (input.now ?? (() => new Date()))().toISOString(),
  };
}

export function createDesktopObservabilityEvent(
  input: Omit<Parameters<typeof createAgentObservabilityEvent>[0], 'source'>,
): AgentObservabilityEvent {
  return createAgentObservabilityEvent({
    ...input,
    source: 'cthutool.desktop',
  });
}

export function observabilityDetailsFromMetadata(
  observability: AgentObservabilityMetadata | undefined,
): AgentObservabilityDetails {
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

const SAFE_DETAIL_KEYS = new Set<keyof AgentObservabilityDetails>([
  'agentId',
  'backendUrl',
  'browserRuntimeMessage',
  'command',
  'commandId',
  'connectionStatus',
  'detectionKind',
  'durationMs',
  'environmentId',
  'lastError',
  'operation',
  'outcome',
  'profileName',
  'reasonCode',
  'requestId',
  'runtimeStatus',
  'siteId',
  'traceId',
]);

export function sanitizeObservabilityDetails(
  details: AgentObservabilityDetails,
): AgentObservabilityDetails {
  const sanitized: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(details)) {
    if (!SAFE_DETAIL_KEYS.has(key as keyof AgentObservabilityDetails)) {
      continue;
    }
    if (key === 'durationMs' && typeof value === 'number') {
      if (Number.isFinite(value)) {
        sanitized[key] = Math.max(0, Math.round(value));
      }
      continue;
    }
    if (typeof value !== 'string') {
      continue;
    }
    sanitized[key] =
      key === 'backendUrl'
        ? sanitizeDiagnosticUrl(value)
        : sanitizeDiagnosticText(value, 256);
  }
  return sanitized as AgentObservabilityDetails;
}

export function sanitizeDiagnosticText(input: string, maxLength = 512): string {
  const redacted = input
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(
      /\b(authorization|cookie|set-cookie|password|secret|token|ticket|nonce)\s*[:=]\s*[^\s,;]+/gi,
      '$1=[REDACTED]',
    )
    .replace(/https?:\/\/[^\s)'"]+/gi, (url) => sanitizeDiagnosticUrl(url));
  return redacted.length <= maxLength
    ? redacted
    : `${redacted.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function sanitizeDiagnosticUrl(input: string): string {
  try {
    const url = new URL(input);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    const pathname = url.pathname === '/' ? '' : url.pathname;
    return `${url.origin}${pathname}`.slice(0, 512);
  } catch {
    return '[REDACTED_URL]';
  }
}

export type DesktopObservabilityLevel = AgentObservabilityLevel;
export type DesktopObservabilityEventName = AgentObservabilityEventName;
export type DesktopObservabilityDetails = AgentObservabilityDetails;
export type DesktopObservabilityEvent = AgentObservabilityEvent;
export type DesktopDiagnosticsSnapshot = AgentDiagnosticsSnapshot;
export type DesktopObservabilitySink = AgentObservabilitySink;
