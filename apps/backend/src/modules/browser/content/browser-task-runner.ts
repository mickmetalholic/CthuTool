import { Inject, Injectable, Optional } from '@nestjs/common';
import { BrowserAutomationError } from '../../browser-automation/browser-automation.errors';

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
  ) {
    this.options = options ?? DEFAULT_BROWSER_TASK_RUNNER_OPTIONS;
  }

  run<T>(
    label: string,
    task: () => Promise<T>,
    options: { readonly timeoutMs?: number } = {},
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        label,
        task,
        timeoutMs: options.timeoutMs ?? this.options.defaultTimeoutMs,
        resolve: resolve as (value: unknown) => void,
        reject,
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
    try {
      item.resolve(await withTimeout(item.task(), item.timeoutMs));
    } catch (error) {
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
            new BrowserAutomationError(
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
