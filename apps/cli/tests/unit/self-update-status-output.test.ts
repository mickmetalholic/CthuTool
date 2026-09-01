import { describe, expect, test } from 'bun:test';
import { renderCliInstallationStatus } from '../../src/command/self-update-status-output';
import type { CliInstallationStatus } from '../../src/domain/self-update-manager';
import type { CliContext } from '../../src/runtime/cli-context';
import type { CliOutput } from '../../src/runtime/output';

const ESC = String.fromCharCode(27);

function createHarness(
  options: {
    readonly context?: Partial<CliContext>;
    readonly outputTty?: boolean;
    readonly colorSupported?: boolean;
  } = {},
) {
  let stdout = '';
  let stderr = '';
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
  const render = (status: CliInstallationStatus) =>
    renderCliInstallationStatus(context, status, {
      output,
      isOutputTty: () => options.outputTty ?? false,
      isColorSupported: () => options.colorSupported ?? false,
    });
  return {
    render,
    stderr: () => stderr,
    stdout: () => stdout,
  };
}

const localStatus: CliInstallationStatus = {
  version: '0.0.0',
  mode: 'local',
  sourceKind: 'main',
  sourceId: 'local',
  installDir: '/tmp/a/very/long/local/CthuTool',
  repo: 'https://github.com/mickmetalholic/CthuTool.git',
  ref: 'main',
  commit: 'e41acd3',
  commitTime: '2026-09-01T12:08:45+08:00',
  commitMessage: 'feat(cli): modernize status output',
  bundlePath: '/tmp/a/very/long/local/CthuTool/apps/cli/dist/index.js',
  bundlePresent: true,
  dirty: false,
};

describe('self-update status output', () => {
  test('renders a grouped plain-text local summary', () => {
    const harness = createHarness();

    harness.render(localStatus);

    expect(harness.stdout()).toContain('◆ CthuTool  v0.0.0  ● LOCAL');
    expect(harness.stdout()).toContain('├─ Source');
    expect(harness.stdout()).toContain('Kind        main');
    expect(harness.stdout()).toContain('Selector    local');
    expect(harness.stdout()).toContain('Checkout    clean');
    expect(harness.stdout()).toContain('└─ Installation');
    expect(harness.stdout()).toContain('e41acd3 · 2026-09-01 12:08:45 +08:00');
    expect(harness.stdout()).toContain(
      'Message     feat(cli): modernize status output',
    );
    expect(harness.stdout()).toContain(localStatus.installDir);
    expect(harness.stdout()).toContain(`✓ present · ${localStatus.bundlePath}`);
    expect(harness.stdout()).not.toContain(ESC);
    expect(harness.stderr()).toBe('');
  });

  test('adds semantic colors only for a supported TTY', () => {
    const harness = createHarness({
      outputTty: true,
      colorSupported: true,
    });

    harness.render(localStatus);

    expect(harness.stdout()).toContain(`${ESC}[`);
    expect(harness.stdout()).toContain('LOCAL');
    expect(harness.stdout()).toContain('e41acd3');
    expect(harness.stdout()).toContain('✓ present');
  });

  test('renders remote and missing-bundle states without local metadata', () => {
    const harness = createHarness();

    harness.render({
      ...localStatus,
      mode: 'remote',
      sourceKind: 'managed',
      sourceId: 'remote',
      commitTime: undefined,
      commitMessage: undefined,
      bundlePresent: false,
    });

    expect(harness.stdout()).toContain('● REMOTE');
    expect(harness.stdout()).toContain(`! missing · ${localStatus.bundlePath}`);
    expect(harness.stdout()).not.toContain('Message');
    expect(harness.stdout()).not.toContain('2026-09-01');
  });

  test('defensively bounds a long displayed commit message', () => {
    const harness = createHarness();
    harness.render({
      ...localStatus,
      commitMessage: `feat(cli): ${'x'.repeat(160)}`,
    });

    const messageLine = harness
      .stdout()
      .split('\n')
      .find((line) => line.includes('Message'));
    expect(messageLine).toEndWith('…');
    expect(
      Array.from(messageLine?.split('Message')[1]?.trim() ?? ''),
    ).toHaveLength(120);
  });

  test('suppresses human output in quiet and JSON modes', () => {
    for (const context of [{ quiet: true }, { json: true }]) {
      const harness = createHarness({ context });
      harness.render(localStatus);
      expect(harness.stdout()).toBe('');
      expect(harness.stderr()).toBe('');
    }
  });
});
