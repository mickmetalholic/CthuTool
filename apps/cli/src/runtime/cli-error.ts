export type CliErrorCode =
  | 'missing_required_argument'
  | 'unknown_selection'
  | 'ambiguous_selection'
  | 'discovery_failed'
  | 'script_load_failed'
  | 'script_execution_failed'
  | 'invalid_option'
  | 'update_failed';

export type CliError = {
  readonly code: CliErrorCode;
  readonly message: string;
  readonly exitCode: number;
};

export class CliCommandError extends Error implements CliError {
  readonly code: CliErrorCode;
  readonly exitCode: number;

  constructor(code: CliErrorCode, message: string, exitCode = 1) {
    super(message);
    this.name = 'CliCommandError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

export function createCliError(
  code: CliErrorCode,
  message: string,
  exitCode = 1,
): CliCommandError {
  return new CliCommandError(code, message, exitCode);
}

export function isCliCommandError(value: unknown): value is CliCommandError {
  return value instanceof CliCommandError;
}
