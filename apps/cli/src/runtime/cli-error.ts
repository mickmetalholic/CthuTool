export type CliErrorCode =
  | 'missing_required_argument'
  | 'unknown_selection'
  | 'ambiguous_selection'
  | 'discovery_failed'
  | 'script_load_failed'
  | 'script_execution_failed'
  | 'invalid_option'
  | 'agent_not_running'
  | 'agent_control_failed'
  | 'agent_not_installed'
  | 'agent_release_untrusted'
  | 'agent_integrity_failed'
  | 'agent_incompatible'
  | 'agent_environment_invalid'
  | 'agent_secret_input_invalid'
  | 'agent_start_failed'
  | 'agent_autostart_unsupported'
  | 'agent_purge_confirmation_required'
  | 'obsidian_agents_not_configured'
  | 'obsidian_agents_invalid_configuration'
  | 'obsidian_agents_setup_required'
  | 'obsidian_agents_conflict'
  | 'obsidian_agents_link_failed'
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
