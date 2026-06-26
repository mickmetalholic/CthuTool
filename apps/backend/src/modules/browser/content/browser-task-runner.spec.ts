import { BrowserAutomationError } from '../../browser-automation/browser-automation.errors';
import { BrowserTaskRunner } from './browser-task-runner';

describe('BrowserTaskRunner', () => {
  it('runs tasks when options are omitted', async () => {
    const runner = new BrowserTaskRunner();

    await expect(
      runner.run('default-options', async () => 'done', { timeoutMs: 50 }),
    ).resolves.toBe('done');
  });

  it('runs tasks within the configured concurrency limit', async () => {
    const runner = new BrowserTaskRunner({
      defaultDelayMs: 0,
      defaultTimeoutMs: 1000,
      maxConcurrency: 1,
    });
    const events: string[] = [];

    const first = runner.run('first', async () => {
      events.push('first-start');
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push('first-end');
      return 'first';
    });
    const second = runner.run('second', async () => {
      events.push('second-start');
      return 'second';
    });

    await expect(Promise.all([first, second])).resolves.toEqual([
      'first',
      'second',
    ]);
    expect(events).toEqual(['first-start', 'first-end', 'second-start']);
  });

  it('returns a navigation timeout error when a task exceeds timeout', async () => {
    const runner = new BrowserTaskRunner({
      defaultDelayMs: 0,
      defaultTimeoutMs: 5,
      maxConcurrency: 1,
    });

    await expect(
      runner.run('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }),
    ).rejects.toEqual(
      new BrowserAutomationError(
        'NAVIGATION_TIMEOUT',
        'Browser task timed out after 5ms',
      ),
    );
  });

  it('emits queue, completion, and failure observability events', async () => {
    const observability = { record: vi.fn() };
    const metrics = createMetricsMock();
    const runner = new BrowserTaskRunner(
      {
        defaultDelayMs: 0,
        defaultTimeoutMs: 5,
        maxConcurrency: 1,
      },
      observability as never,
      metrics as never,
    );

    await expect(runner.run('fast', async () => 'done')).resolves.toBe('done');
    await expect(
      runner.run('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      }),
    ).rejects.toMatchObject({ code: 'NAVIGATION_TIMEOUT' });

    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'browser.task_queued' }),
    );
    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'browser.task_completed' }),
    );
    expect(observability.record).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'browser.task_failed' }),
    );
    expect(metrics.recordBrowserTaskQueued).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'fast', queueLength: 1 }),
    );
    expect(metrics.recordBrowserTaskStarted).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'fast' }),
    );
    expect(metrics.recordBrowserTaskCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'fast' }),
    );
    expect(metrics.recordBrowserTaskFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'NAVIGATION_TIMEOUT',
        label: 'slow',
      }),
    );
  });
});

function createMetricsMock() {
  return {
    recordBrowserTaskCompleted: vi.fn(),
    recordBrowserTaskFailed: vi.fn(),
    recordBrowserTaskQueued: vi.fn(),
    recordBrowserTaskStarted: vi.fn(),
  };
}
