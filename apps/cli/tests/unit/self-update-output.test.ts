import { describe, expect, test } from 'bun:test';
import { createSelfUpdateRenderer } from '../../src/command/self-update-output';
import type {
  SelfUpdateEvent,
  SelfUpdatePlan,
} from '../../src/domain/self-update-manager';
import type { CliContext } from '../../src/runtime/cli-context';
import type { CliOutput } from '../../src/runtime/output';

function createHarness(
  options: {
    readonly context?: Partial<CliContext>;
    readonly outputTty?: boolean;
    readonly verbose?: boolean;
  } = {},
) {
  let stdout = '';
  let stderr = '';
  const spinnerCalls: string[] = [];
  const output: CliOutput = {
    stdout: { write: (chunk) => (stdout += chunk) },
    stderr: { write: (chunk) => (stderr += chunk) },
  };
  const context: CliContext = {
    isTty: false,
    interactive: false,
    json: false,
    quiet: false,
    ...options.context,
  };
  const renderer = createSelfUpdateRenderer(
    context,
    { verbose: options.verbose ?? false },
    {
      output,
      isOutputTty: () => options.outputTty ?? false,
      createSpinner: () => ({
        start: (message = '') => spinnerCalls.push(`start:${message}`),
        stop: (message = '', code) =>
          spinnerCalls.push(`stop:${code ?? 0}:${message}`),
        message: (message = '') => spinnerCalls.push(`message:${message}`),
      }),
    },
  );
  return {
    renderer,
    spinnerCalls,
    stdout: () => stdout,
    stderr: () => stderr,
  };
}

const plan: SelfUpdatePlan = {
  status: 'update_available',
  repo: 'https://github.com/example/CthuTool.git',
  ref: 'main',
  installDir: '/tmp/CthuTool',
  before: {
    ref: 'main',
    commit: '1111111111111111111111111111111111111111',
    shortCommit: '1111111',
  },
  target: {
    ref: 'main',
    commit: '2222222222222222222222222222222222222222',
    shortCommit: '2222222',
  },
  changes: {
    count: 7,
    highlights: Array.from({ length: 5 }, (_, index) => ({
      commit: `c${index + 1}`,
      subject: `Change ${index + 1}`,
    })),
    omitted: 2,
  },
  phases: ['preflight', 'check_remote'],
};

describe('self-update output', () => {
  test('uses one active spinner for TTY phase progress', () => {
    const harness = createHarness({
      context: { isTty: true, interactive: true },
      outputTty: true,
    });
    harness.renderer.onEvent({
      type: 'phase_started',
      phase: 'preflight',
    });
    harness.renderer.onEvent({
      type: 'phase_completed',
      phase: 'preflight',
    });

    expect(harness.spinnerCalls).toEqual([
      'start:Checking local update state',
      'stop:0:Checking local update state complete',
    ]);
    expect(harness.stdout()).toBe('\u001b[36mCthuTool update\u001b[39m\n');
  });

  test('renders stable non-TTY progress and a bounded change summary', () => {
    const harness = createHarness();
    const events: SelfUpdateEvent[] = [
      { type: 'phase_started', phase: 'preflight' },
      { type: 'phase_completed', phase: 'preflight' },
      { type: 'plan', plan },
    ];
    for (const event of events) harness.renderer.onEvent(event);
    harness.renderer.renderCheckResult(plan);

    expect(harness.stdout()).toContain('- Checking local update state');
    expect(harness.stdout()).toContain('1111111');
    expect(harness.stdout()).toContain('2222222');
    expect(harness.stdout()).toContain('changes: 7 commit(s)');
    expect(harness.stdout()).toContain('… 2 more commit(s)');
    expect(harness.stdout()).toContain('Update available');
    expect(harness.stdout()).not.toContain('\u001b[');
  });

  test('suppresses human progress in quiet and JSON modes', () => {
    for (const context of [{ quiet: true }, { json: true }]) {
      const harness = createHarness({ context });
      harness.renderer.onEvent({ type: 'phase_started', phase: 'preflight' });
      harness.renderer.onEvent({ type: 'plan', plan });
      harness.renderer.renderCheckResult(plan);
      expect(harness.stdout()).toBe('');
      expect(harness.stderr()).toBe('');
    }
  });

  test('reports when an already-current explicit source needs a global relink', () => {
    const harness = createHarness();
    const relinkPlan: SelfUpdatePlan = {
      ...plan,
      status: 'up_to_date',
      relinkRequired: true,
      changes: undefined,
    };

    harness.renderer.renderCheckResult(relinkPlan);

    expect(harness.stdout()).toContain('Global relink required');
    expect(harness.stdout()).toContain('run chc update');
  });

  test('writes bounded verbose command details only to stderr', () => {
    const harness = createHarness({
      context: { json: true },
      verbose: true,
    });
    harness.renderer.onEvent({
      type: 'command',
      phase: 'check_remote',
      command: 'git',
      args: ['fetch', 'https://***@github.com/example/repo.git'],
      cwd: '/tmp/CthuTool',
      code: 0,
      stderr: 'remote output',
    });

    expect(harness.stdout()).toBe('');
    expect(harness.stderr()).toContain('$ git fetch');
    expect(harness.stderr()).toContain('remote output');
  });

  test('stops active TTY progress with a failure state', () => {
    const harness = createHarness({
      context: { isTty: true, interactive: true },
      outputTty: true,
    });
    harness.renderer.onEvent({ type: 'phase_started', phase: 'fetch' });
    harness.renderer.onEvent({
      type: 'failure',
      phase: 'fetch',
      summary: 'Fetch failed',
      hint: 'Retry',
    });

    expect(harness.spinnerCalls.at(-1)).toBe(
      'stop:1:Fetching repository updates failed',
    );
  });
});
