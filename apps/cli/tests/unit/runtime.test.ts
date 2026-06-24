import { describe, expect, test } from 'bun:test';
import { createCliContext } from '../../src/runtime/cli-context';
import { createCliError } from '../../src/runtime/cli-error';
import { runObservedCliCommand } from '../../src/runtime/command-diagnostics';
import {
  createCliCommandDiagnostics,
  createCliDiagnostics,
} from '../../src/runtime/observability';
import {
  type CliOutput,
  writeCommandError,
  writeHumanStatus,
  writeJsonValue,
  writeWarning,
} from '../../src/runtime/output';

function captureOutput(): {
  output: CliOutput;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout,
    stderr,
    output: {
      stdout: { write: (chunk) => stdout.push(chunk) },
      stderr: { write: (chunk) => stderr.push(chunk) },
    },
  };
}

describe('CLI runtime contract', () => {
  test('derives interactive context from TTY by default', () => {
    const context = createCliContext({}, { isTty: () => true });

    expect(context.isTty).toBe(true);
    expect(context.interactive).toBe(true);
    expect(context.json).toBe(false);
    expect(context.quiet).toBe(false);
  });

  test('honors no-interactive, json, and quiet flags', () => {
    const context = createCliContext(
      { noInteractive: true, json: true, quiet: true },
      { isTty: () => true },
    );

    expect(context.isTty).toBe(true);
    expect(context.interactive).toBe(false);
    expect(context.json).toBe(true);
    expect(context.quiet).toBe(true);
  });

  test('writes one JSON value to stdout', () => {
    const { output, stdout, stderr } = captureOutput();

    writeJsonValue(output, { ok: true, command: 'test' });

    expect(JSON.parse(stdout.join(''))).toEqual({ ok: true, command: 'test' });
    expect(stderr.join('')).toBe('');
  });

  test('renders command errors as JSON when requested', () => {
    const { output, stdout, stderr } = captureOutput();
    const context = createCliContext({ json: true }, { isTty: () => false });

    writeCommandError(
      context,
      output,
      createCliError('missing_required_argument', 'script id is required'),
    );

    expect(JSON.parse(stdout.join(''))).toEqual({
      ok: false,
      error: {
        code: 'missing_required_argument',
        message: 'script id is required',
      },
    });
    expect(stderr.join('')).toBe('');
  });

  test('renders human errors and warnings to stderr', () => {
    const { output, stdout, stderr } = captureOutput();
    const context = createCliContext({}, { isTty: () => false });

    writeCommandError(
      context,
      output,
      createCliError('unknown_selection', 'unknown script id: nope'),
    );
    writeWarning(output, 'warning text');

    expect(stdout.join('')).toBe('');
    expect(stderr.join('')).toBe('unknown script id: nope\nwarning text\n');
  });

  test('quiet human status suppresses non-essential stdout', () => {
    const { output, stdout } = captureOutput();
    const context = createCliContext({ quiet: true }, { isTty: () => false });

    writeHumanStatus(context, output, 'hello');

    expect(stdout.join('')).toBe('');
  });

  test('writes structured diagnostics to stderr without corrupting JSON stdout', () => {
    const { output, stdout, stderr } = captureOutput();
    const context = createCliContext({ json: true }, { isTty: () => false });
    const diagnostics = createCliDiagnostics(
      context,
      output,
      { command: 'test' },
      {
        isEnabled: () => true,
        now: () => new Date('2026-06-23T00:00:00.000Z'),
      },
    );

    diagnostics.emit({
      level: 'info',
      event: 'cli.test_event',
      message: 'failed with token=secret-value',
      details: {
        inputPath: '/tmp/private/sample.cbz',
        password: 'secret-value',
      },
    });
    writeJsonValue(output, { ok: true, command: 'test' });

    expect(JSON.parse(stdout.join(''))).toEqual({ ok: true, command: 'test' });
    const diagnostic = JSON.parse(stderr.join(''));
    expect(diagnostic).toEqual(
      expect.objectContaining({
        command: 'test',
        event: 'cli.test_event',
        level: 'info',
        message: 'failed with token=[redacted]',
        source: 'cthutool.cli',
        timestamp: '2026-06-23T00:00:00.000Z',
      }),
    );
    expect(diagnostic.details.password).toBe('[redacted]');
    expect(diagnostic.details.inputPath).toBe('private/sample.cbz');
  });

  test('quiet mode suppresses nonessential diagnostics but preserves errors', () => {
    const { output, stderr } = captureOutput();
    const context = createCliContext({ quiet: true }, { isTty: () => false });
    const diagnostics = createCliDiagnostics(context, output, undefined, {
      isEnabled: () => true,
      now: () => new Date('2026-06-23T00:00:00.000Z'),
    });

    diagnostics.emit({ level: 'info', event: 'cli.info' });
    diagnostics.emit({ level: 'error', event: 'cli.error' });

    const lines = stderr.join('').trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).event).toBe('cli.error');
  });

  test('records command completion diagnostics with duration and modes', () => {
    const { output, stderr } = captureOutput();
    const context = createCliContext({ json: true }, { isTty: () => false });
    let nowMs = 100;
    const command = createCliCommandDiagnostics(
      context,
      output,
      { command: 'scripts' },
      {
        isEnabled: () => true,
        now: () => new Date('2026-06-23T00:00:00.000Z'),
        nowMs: () => nowMs,
      },
    );

    nowMs = 145;
    command.complete();

    const lines = stderr
      .join('')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(lines.map((line) => line.event)).toEqual([
      'cli.command_started',
      'cli.command_completed',
    ]);
    expect(lines[1]).toEqual(
      expect.objectContaining({
        command: 'scripts',
        durationMs: 45,
        exitCode: 0,
      }),
    );
    expect(lines[1].details.json).toBe(true);
  });

  test('records unexpected command failures before rethrowing', async () => {
    const events: string[] = [];
    await expect(
      runObservedCliCommand(
        {},
        { command: 'test' },
        async () => {
          throw new Error('unexpected failure');
        },
        {
          diagnostics: {
            complete: () => events.push('complete'),
            fail: (error) => events.push(`fail:${error.code}`),
          },
        },
      ),
    ).rejects.toThrow('unexpected failure');

    expect(events).toEqual(['fail:invalid_option']);
  });
});
