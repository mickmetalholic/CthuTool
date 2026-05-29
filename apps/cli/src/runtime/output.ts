import type { CliContext } from './cli-context';
import type { CliError } from './cli-error';

export type WritableStreamLike = {
  readonly write: (chunk: string) => unknown;
};

export type CliOutput = {
  readonly stdout: WritableStreamLike;
  readonly stderr: WritableStreamLike;
};

export const processOutput: CliOutput = {
  stdout: process.stdout,
  stderr: process.stderr,
};

export function writeJsonValue(
  output: CliOutput,
  value: Record<string, unknown>,
): void {
  output.stdout.write(`${JSON.stringify(value)}\n`);
}

export function writeCommandError(
  context: CliContext,
  output: CliOutput,
  error: CliError,
): void {
  if (context.json) {
    writeJsonValue(output, {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  output.stderr.write(`${error.message}\n`);
}

export function writeWarning(output: CliOutput, message: string): void {
  output.stderr.write(`${message}\n`);
}

export function writeHumanStatus(
  context: CliContext,
  output: CliOutput,
  message = '',
): void {
  if (context.json || context.quiet) {
    return;
  }
  output.stdout.write(`${message}\n`);
}
