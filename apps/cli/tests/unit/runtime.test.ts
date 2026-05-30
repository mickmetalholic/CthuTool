import { describe, expect, test } from 'bun:test';
import { createCliContext } from '../../src/runtime/cli-context';
import { createCliError } from '../../src/runtime/cli-error';
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
});
