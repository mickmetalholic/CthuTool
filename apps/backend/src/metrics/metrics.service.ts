import { Injectable } from '@nestjs/common';
import {
  Counter,
  collectDefaultMetrics,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

export type HttpMetricInput = {
  readonly durationMs: number;
  readonly method: string;
  readonly path: string;
  readonly status: number;
};

export type ReadinessMetricInput = {
  readonly browserAgentStatus: 'degraded' | 'ok';
  readonly diagnosticsStoreStatus: 'degraded' | 'ok';
  readonly status: 'degraded' | 'ready';
};

export type BrowserTaskMetricInput = {
  readonly active?: number;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly label: string;
  readonly outcome?: 'failed' | 'ok' | 'queued' | 'started' | 'timeout';
  readonly queueLength?: number;
};

export type AgentCommandMetricInput = {
  readonly commandType?: string;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly responseType?: string;
};

const DEFAULT_METRICS_PREFIX = 'cthutool_backend_';
const HTTP_DURATION_BUCKETS_SECONDS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30,
];
const OPERATION_DURATION_BUCKETS_SECONDS = [
  0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60,
];
const SAFE_LABEL_VALUE_PATTERN = /^[a-zA-Z0-9_.:-]{1,80}$/;
const SENSITIVE_LABEL_KEY_PATTERN =
  /authorization|command.?id|cookie|html|local.?storage|password|profile.?path|query|raw.?url|request.?id|screenshot|secret|session.?storage|subject.?id|token|trace.?id|url/i;
const SENSITIVE_LABEL_VALUE_PATTERN =
  /[/?#&=]|https?:|token|secret|cookie|authorization|password/i;

@Injectable()
export class BackendMetricsService {
  private readonly registry = new Registry();
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly readinessDependencyStatus: Gauge<string>;
  private readonly readinessStatus: Gauge<string>;
  private readonly browserTaskQueueLength: Gauge<string>;
  private readonly browserTaskActive: Gauge<string>;
  private readonly browserTaskDuration: Histogram<string>;
  private readonly browserTaskTotal: Counter<string>;
  private readonly agentCommandDuration: Histogram<string>;
  private readonly agentCommandTotal: Counter<string>;

  constructor() {
    this.registry.setDefaultLabels({ service: 'backend' });
    collectDefaultMetrics({
      prefix: DEFAULT_METRICS_PREFIX,
      register: this.registry,
    });

    this.httpRequestsTotal = new Counter({
      name: 'cthutool_backend_http_requests_total',
      help: 'Total backend HTTP requests.',
      labelNames: ['method', 'route', 'status_class', 'outcome'],
      registers: [this.registry],
    });
    this.httpRequestDuration = new Histogram({
      name: 'cthutool_backend_http_request_duration_seconds',
      help: 'Backend HTTP request duration in seconds.',
      labelNames: ['method', 'route', 'status_class', 'outcome'],
      buckets: HTTP_DURATION_BUCKETS_SECONDS,
      registers: [this.registry],
    });
    this.readinessDependencyStatus = new Gauge({
      name: 'cthutool_backend_readiness_dependency_status',
      help: 'Backend readiness dependency status where 1 is the active status.',
      labelNames: ['dependency', 'status'],
      registers: [this.registry],
    });
    this.readinessStatus = new Gauge({
      name: 'cthutool_backend_readiness_status',
      help: 'Backend overall readiness status where 1 is the active status.',
      labelNames: ['status'],
      registers: [this.registry],
    });
    this.browserTaskQueueLength = new Gauge({
      name: 'cthutool_backend_browser_task_queue_length',
      help: 'Queued backend browser tasks.',
      labelNames: ['task'],
      registers: [this.registry],
    });
    this.browserTaskActive = new Gauge({
      name: 'cthutool_backend_browser_task_active',
      help: 'Active backend browser tasks.',
      labelNames: ['task'],
      registers: [this.registry],
    });
    this.browserTaskDuration = new Histogram({
      name: 'cthutool_backend_browser_task_duration_seconds',
      help: 'Backend browser task duration in seconds.',
      labelNames: ['task', 'outcome'],
      buckets: OPERATION_DURATION_BUCKETS_SECONDS,
      registers: [this.registry],
    });
    this.browserTaskTotal = new Counter({
      name: 'cthutool_backend_browser_task_total',
      help: 'Total backend browser task lifecycle events.',
      labelNames: ['task', 'outcome'],
      registers: [this.registry],
    });
    this.agentCommandDuration = new Histogram({
      name: 'cthutool_backend_agent_command_duration_seconds',
      help: 'Backend desktop agent command duration in seconds.',
      labelNames: ['command_type', 'outcome'],
      buckets: OPERATION_DURATION_BUCKETS_SECONDS,
      registers: [this.registry],
    });
    this.agentCommandTotal = new Counter({
      name: 'cthutool_backend_agent_command_total',
      help: 'Total backend desktop agent command dispatch outcomes.',
      labelNames: ['command_type', 'outcome'],
      registers: [this.registry],
    });
  }

  contentType(): string {
    return this.registry.contentType;
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }

  recordHttpRequest(input: HttpMetricInput): void {
    this.guard(() => {
      const labels = assertSafeLabels({
        method: normalizeHttpMethod(input.method),
        outcome: normalizeHttpOutcome(input.status),
        route: normalizeHttpRoute(input.path),
        status_class: normalizeStatusClass(input.status),
      });
      this.httpRequestsTotal.inc(labels);
      this.httpRequestDuration.observe(
        labels,
        millisToSeconds(input.durationMs),
      );
    });
  }

  recordReadiness(input: ReadinessMetricInput): void {
    this.guard(() => {
      const dependencies = [
        ['browser_agent', input.browserAgentStatus],
        ['diagnostics_store', input.diagnosticsStoreStatus],
      ] as const;
      for (const [dependency, activeStatus] of dependencies) {
        for (const status of ['ok', 'degraded'] as const) {
          this.readinessDependencyStatus.set(
            assertSafeLabels({ dependency, status }),
            status === activeStatus ? 1 : 0,
          );
        }
      }
      for (const status of ['ready', 'degraded'] as const) {
        this.readinessStatus.set(
          assertSafeLabels({ status }),
          status === input.status ? 1 : 0,
        );
      }
    });
  }

  recordBrowserTaskQueued(input: BrowserTaskMetricInput): void {
    this.guard(() => {
      const task = normalizeTaskLabel(input.label);
      this.browserTaskTotal.inc(assertSafeLabels({ outcome: 'queued', task }));
      if (input.queueLength !== undefined) {
        this.browserTaskQueueLength.set(
          assertSafeLabels({ task }),
          input.queueLength,
        );
      }
      if (input.active !== undefined) {
        this.browserTaskActive.set(assertSafeLabels({ task }), input.active);
      }
    });
  }

  recordBrowserTaskStarted(input: BrowserTaskMetricInput): void {
    this.guard(() => {
      const task = normalizeTaskLabel(input.label);
      this.browserTaskTotal.inc(assertSafeLabels({ outcome: 'started', task }));
      if (input.queueLength !== undefined) {
        this.browserTaskQueueLength.set(
          assertSafeLabels({ task }),
          input.queueLength,
        );
      }
      if (input.active !== undefined) {
        this.browserTaskActive.set(assertSafeLabels({ task }), input.active);
      }
    });
  }

  recordBrowserTaskCompleted(input: BrowserTaskMetricInput): void {
    this.recordBrowserTaskFinished({ ...input, outcome: 'ok' });
  }

  recordBrowserTaskFailed(input: BrowserTaskMetricInput): void {
    this.recordBrowserTaskFinished({
      ...input,
      outcome: input.errorCode === 'NAVIGATION_TIMEOUT' ? 'timeout' : 'failed',
    });
  }

  recordAgentCommandDispatched(input: AgentCommandMetricInput): void {
    this.guard(() => {
      this.agentCommandTotal.inc(
        assertSafeLabels({
          command_type: normalizeCommandType(input.commandType),
          outcome: 'dispatched',
        }),
      );
    });
  }

  recordAgentCommandCompleted(input: AgentCommandMetricInput): void {
    this.recordAgentCommandFinished({
      ...input,
      outcome: normalizeAgentResponseOutcome(input.responseType),
    });
  }

  recordAgentCommandFailed(input: AgentCommandMetricInput): void {
    this.recordAgentCommandFinished({
      ...input,
      outcome:
        input.errorCode === 'AGENT_COMMAND_TIMEOUT' ||
        /timed out/i.test(String(input.errorCode ?? ''))
          ? 'timeout'
          : 'unavailable',
    });
  }

  assertSafeLabelsForTest(
    labels: Record<string, string>,
  ): Record<string, string> {
    return assertSafeLabels(labels);
  }

  private recordBrowserTaskFinished(
    input: BrowserTaskMetricInput & {
      readonly outcome: 'failed' | 'ok' | 'timeout';
    },
  ): void {
    this.guard(() => {
      const labels = assertSafeLabels({
        outcome: input.outcome,
        task: normalizeTaskLabel(input.label),
      });
      this.browserTaskTotal.inc(labels);
      if (input.durationMs !== undefined) {
        this.browserTaskDuration.observe(
          labels,
          millisToSeconds(input.durationMs),
        );
      }
    });
  }

  private recordAgentCommandFinished(
    input: AgentCommandMetricInput & {
      readonly outcome: 'error' | 'success' | 'timeout' | 'unavailable';
    },
  ): void {
    this.guard(() => {
      const labels = assertSafeLabels({
        command_type: normalizeCommandType(input.commandType),
        outcome: input.outcome,
      });
      this.agentCommandTotal.inc(labels);
      if (input.durationMs !== undefined) {
        this.agentCommandDuration.observe(
          labels,
          millisToSeconds(input.durationMs),
        );
      }
    });
  }

  private guard(record: () => void): void {
    try {
      record();
    } catch {
      // Metrics collection must not change application behavior.
    }
  }
}

export function normalizeHttpRoute(path: string): string {
  const pathname = path.split('?')[0] || '/';
  if (pathname === '/metrics') {
    return 'metrics';
  }
  if (pathname === '/health' || pathname === '/health/') {
    return 'health';
  }
  if (pathname === '/health/ready' || pathname === '/health/ready/') {
    return 'health_ready';
  }
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  if (!firstSegment) {
    return 'root';
  }
  if (
    [
      'agents',
      'browser',
      'browser-auth',
      'douban-movie-info',
      'sites',
      'ws',
    ].includes(firstSegment)
  ) {
    return firstSegment.replaceAll('-', '_');
  }
  return 'other';
}

export function normalizeTaskLabel(label: string): string {
  if (label.startsWith('browser:')) {
    return 'browser.capture';
  }
  return normalizeBoundedLabel(label, 'task.other');
}

export function normalizeCommandType(commandType: string | undefined): string {
  return normalizeBoundedLabel(commandType ?? 'unknown', 'unknown');
}

function normalizeHttpMethod(method: string): string {
  const normalized = method.toUpperCase();
  return ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'].includes(normalized)
    ? normalized
    : 'OTHER';
}

function normalizeHttpOutcome(status: number): string {
  if (status >= 500) {
    return 'error';
  }
  if (status >= 400) {
    return 'failure';
  }
  return 'success';
}

function normalizeStatusClass(status: number): string {
  if (status >= 100 && status < 600) {
    return `${Math.floor(status / 100)}xx`;
  }
  return 'unknown';
}

function normalizeAgentResponseOutcome(
  responseType: string | undefined,
): 'error' | 'success' {
  return responseType?.endsWith('Error') || responseType === 'browser.error'
    ? 'error'
    : 'success';
}

function normalizeBoundedLabel(value: string, fallback: string): string {
  if (
    SAFE_LABEL_VALUE_PATTERN.test(value) &&
    !SENSITIVE_LABEL_VALUE_PATTERN.test(value)
  ) {
    return value;
  }
  return fallback;
}

function assertSafeLabels<T extends Record<string, string>>(labels: T): T {
  for (const [key, value] of Object.entries(labels)) {
    if (SENSITIVE_LABEL_KEY_PATTERN.test(key)) {
      throw new Error(`unsafe metric label key: ${key}`);
    }
    if (
      !SAFE_LABEL_VALUE_PATTERN.test(value) ||
      SENSITIVE_LABEL_VALUE_PATTERN.test(value)
    ) {
      throw new Error(`unsafe metric label value for ${key}`);
    }
  }
  return labels;
}

function millisToSeconds(durationMs: number): number {
  return Math.max(0, durationMs) / 1000;
}
