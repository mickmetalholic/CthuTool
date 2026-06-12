import { BrowserAutomationError } from './browser-automation.errors';
import { BrowserTaskRunner } from './browser-task-runner';

describe('BrowserTaskRunner', () => {
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
});
