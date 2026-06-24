import { type CliContext, createCliContext } from './cli-context';
import { type CliError, createCliError, isCliCommandError } from './cli-error';
import {
  type CliCommandDiagnostics,
  type CliDiagnosticBase,
  createCliCommandDiagnostics,
} from './observability';
import { processOutput } from './output';

export type ObservedCliCommandScope = {
  readonly context: CliContext;
  readonly complete: (input?: {
    readonly exitCode?: number;
    readonly details?: Record<string, unknown>;
  }) => void;
  readonly fail: (
    error: CliError,
    input?: { readonly details?: Record<string, unknown> },
  ) => void;
};

export async function runObservedCliCommand(
  args: Record<string, unknown>,
  base: CliDiagnosticBase,
  run: (scope: ObservedCliCommandScope) => Promise<void> | void,
  deps: {
    readonly isTty?: () => boolean;
    readonly diagnostics?: CliCommandDiagnostics;
  } = {},
): Promise<void> {
  const context = createCliContext(
    args,
    deps.isTty ? { isTty: deps.isTty } : undefined,
  );
  const diagnostics =
    deps.diagnostics ??
    createCliCommandDiagnostics(context, processOutput, base);
  let finalized = false;
  const scope: ObservedCliCommandScope = {
    context,
    complete: (input = {}) => {
      diagnostics.complete({
        ...input,
        exitCode: input.exitCode ?? numericProcessExitCode(),
      });
      finalized = true;
    },
    fail: (error, input = {}) => {
      diagnostics.fail(error, input);
      finalized = true;
    },
  };

  try {
    await run(scope);
    if (!finalized) {
      scope.complete();
    }
  } catch (error) {
    if (!finalized) {
      scope.fail(toDiagnosticCliError(error));
    }
    throw error;
  }
}

function numericProcessExitCode(): number {
  return typeof process.exitCode === 'number' ? process.exitCode : 0;
}

function toDiagnosticCliError(error: unknown): CliError {
  if (isCliCommandError(error)) {
    return error;
  }
  return createCliError(
    'invalid_option',
    error instanceof Error ? error.message : 'command failed unexpectedly',
  );
}
