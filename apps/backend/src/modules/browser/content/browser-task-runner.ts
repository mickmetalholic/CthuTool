import { Inject, Injectable, Optional } from '@nestjs/common';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendMetricsService } from '../../../metrics';
// Nest DI needs runtime class reference; `import type` strips metadata.
// biome-ignore lint/style/useImportType: constructor injection token
import { BackendObservabilityService } from '../../../observability';
import { BrowserWorkflowError } from '../shared/browser.errors';

export const BROWSER_TASK_RUNNER_OPTIONS = 'BROWSER_TASK_RUNNER_OPTIONS';

export type BrowserTaskRunnerOptions = {
  readonly defaultDelayMs: number;
  readonly defaultTimeoutMs: number;
  readonly maxConcurrency: number;
};

type QueueItem<T> = {
  readonly label: string;
  readonly task: () => Promise<T>;
  readonly timeoutMs: number;
  readonly resolve: (value: T) => void;
  readonly reject: (error: unknown) => void;
};

const DEFAULT_BROWSER_TASK_RUNNER_OPTIONS: BrowserTaskRunnerOptions = {
  defaultDelayMs: 1000,
  defaultTimeoutMs: 30000,
  maxConcurrency: 1,
};

@Injectable()
export class BrowserTaskRunner {
  private active = 0;
  private readonly options: BrowserTaskRunnerOptions;
  private readonly queue: Array<QueueItem<unknown>> = [];

  constructor(
    @Optional()
    @Inject(BROWSER_TASK_RUNNER_OPTIONS)
    options?: BrowserTaskRunnerOptions,
    @Optional()
    private readonly observability?: BackendObservabilityService,
    @Optional()
    private readonly metrics?: BackendMetricsService,
  ) {
    this.options = options ?? DEFAULT_BROWSER_TASK_RUNNER_OPTIONS;
  }

  run<T>(
    label: string,
    task: () => Promise<T>,
    options: { readonly timeoutMs?: number } = {},
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutMs = options.timeoutMs ?? this.options.defaultTimeoutMs;
      this.queue.push({
        label,
        task,
        timeoutMs,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.observability?.record({
        event: 'browser.task_queued',
        details: {
          active: this.active,
          label,
          queueLength: this.queue.length,
          timeoutMs,
        },
      });
      this.metrics?.recordBrowserTaskQueued({
        active: this.active,
        label,
        queueLength: this.queue.length,
      });
      this.drain();
    });
  }

  private drain(): void {
    while (this.active < this.options.maxConcurrency && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) {
        return;
      }
      this.active += 1;
      void this.execute(item).finally(() => {
        this.active -= 1;
        setTimeout(() => this.drain(), this.options.defaultDelayMs);
      });
    }
  }

  private async execute<T>(item: QueueItem<T>): Promise<void> {
    const startedAt = Date.now();
    this.observability?.record({
      event: 'browser.task_started',
      details: {
        active: this.active,
        label: item.label,
        queueLength: this.queue.length,
        timeoutMs: item.timeoutMs,
      },
    });
    this.metrics?.recordBrowserTaskStarted({
      active: this.active,
      label: item.label,
      queueLength: this.queue.length,
    });
    try {
      item.resolve(await withTimeout(item.task(), item.timeoutMs));
      const durationMs = Date.now() - startedAt;
      this.observability?.record({
        event: 'browser.task_completed',
        details: {
          durationMs,
          label: item.label,
          outcome: 'ok',
        },
      });
      this.metrics?.recordBrowserTaskCompleted({
        durationMs,
        label: item.label,
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const errorCode =
        error instanceof BrowserWorkflowError
          ? error.code
          : 'BROWSER_TASK_FAILED';
      this.observability?.record({
        event: 'browser.task_failed',
        level: 'warn',
        details: {
          durationMs,
          errorCode,
          label: item.label,
          outcome: 'failed',
        },
      });
      this.metrics?.recordBrowserTaskFailed({
        durationMs,
        errorCode,
        label: item.label,
      });
      item.reject(error);
    }
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(
            new BrowserWorkflowError(
              'NAVIGATION_TIMEOUT',
              `Browser task timed out after ${timeoutMs}ms`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
