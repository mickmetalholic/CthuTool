import { basename, dirname, sep } from 'node:path';
import type { CliContext } from './cli-context';
import type { CliError, CliErrorCode } from './cli-error';
import type { CliOutput } from './output';

export const CLI_DIAGNOSTICS_ENV = 'CHC_CLI_DIAGNOSTICS';

export type CliDiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';

export type CliDiagnosticEvent = {
  readonly source: 'cthutool.cli';
  readonly level: CliDiagnosticLevel;
  readonly event: string;
  readonly timestamp: string;
  readonly command?: string;
  readonly subcommand?: string;
  readonly scriptId?: string;
  readonly phase?: string;
  readonly durationMs?: number;
  readonly exitCode?: number;
  readonly errorCode?: CliErrorCode;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
};

export type CliDiagnosticInput = Omit<
  CliDiagnosticEvent,
  'source' | 'timestamp' | 'details'
> & {
  readonly details?: Record<string, unknown>;
};

export type CliDiagnostics = {
  readonly emit: (input: CliDiagnosticInput) => void;
  readonly child: (base: CliDiagnosticBase) => CliDiagnostics;
  readonly isEnabled: () => boolean;
};

export type CliDiagnosticBase = {
  readonly command?: string;
  readonly subcommand?: string;
  readonly scriptId?: string;
};

export type CliCommandDiagnostics = {
  readonly complete: (input?: {
    readonly exitCode?: number;
    readonly details?: Record<string, unknown>;
  }) => void;
  readonly fail: (
    error: CliError,
    input?: { readonly details?: Record<string, unknown> },
  ) => void;
};

const REDACTED = '[redacted]';
const MAX_STRING_LENGTH = 160;
const MAX_OBJECT_KEYS = 16;

export function isCliDiagnosticsEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env[CLI_DIAGNOSTICS_ENV];
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function createCliDiagnostics(
  context: CliContext,
  output: CliOutput,
  base: CliDiagnosticBase = {},
  deps: {
    readonly isEnabled?: () => boolean;
    readonly now?: () => Date;
  } = {},
): CliDiagnostics {
  const now = deps.now ?? (() => new Date());
  const isEnabled = deps.isEnabled ?? (() => isCliDiagnosticsEnabled());

  const diagnostics: CliDiagnostics = {
    isEnabled,
    child: (childBase) =>
      createCliDiagnostics(
        context,
        output,
        { ...base, ...childBase },
        { isEnabled, now },
      ),
    emit: (input) => {
      if (!isEnabled() || isSuppressed(context, input.level)) {
        return;
      }
      const event: CliDiagnosticEvent = {
        source: 'cthutool.cli',
        timestamp: now().toISOString(),
        ...base,
        ...input,
        message:
          input.message === undefined
            ? undefined
            : sanitizeDiagnosticMessage(input.message),
        details: input.details
          ? sanitizeDiagnosticDetails(input.details)
          : undefined,
      };
      output.stderr.write(`${JSON.stringify(dropUndefined(event))}\n`);
    },
  };
  return diagnostics;
}

export function createCliCommandDiagnostics(
  context: CliContext,
  output: CliOutput,
  base: CliDiagnosticBase,
  deps: {
    readonly isEnabled?: () => boolean;
    readonly nowMs?: () => number;
    readonly now?: () => Date;
  } = {},
): CliCommandDiagnostics {
  const nowMs = deps.nowMs ?? (() => Date.now());
  const startedAt = nowMs();
  const diagnostics = createCliDiagnostics(context, output, base, deps);
  diagnostics.emit({
    level: 'debug',
    event: 'cli.command_started',
    phase: 'start',
    details: modeDetails(context),
  });
  return {
    complete: (input = {}) => {
      diagnostics.emit({
        level: 'info',
        event: 'cli.command_completed',
        phase: 'complete',
        durationMs: Math.max(0, nowMs() - startedAt),
        exitCode: input.exitCode ?? 0,
        details: { ...modeDetails(context), ...input.details },
      });
    },
    fail: (error, input = {}) => {
      diagnostics.emit({
        level: 'error',
        event: 'cli.command_failed',
        phase: 'failure',
        durationMs: Math.max(0, nowMs() - startedAt),
        exitCode: error.exitCode,
        errorCode: error.code,
        message: error.message,
        details: { ...modeDetails(context), ...input.details },
      });
    },
  };
}

export function summarizeScriptArgs(
  args: Record<string, unknown>,
): Record<string, unknown> {
  const keys = Object.keys(args).sort();
  return {
    argumentCount: keys.length,
    argumentKeys: keys,
  };
}

export function sanitizeDiagnosticDetails(
  details: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizeObject(details, 0);
}

function modeDetails(context: CliContext): Record<string, unknown> {
  return {
    interactive: context.interactive,
    isTty: context.isTty,
    json: context.json,
    quiet: context.quiet,
  };
}

function isSuppressed(context: CliContext, level: CliDiagnosticLevel): boolean {
  return context.quiet && (level === 'debug' || level === 'info');
}

function sanitizeObject(
  value: Record<string, unknown>,
  depth: number,
): Record<string, unknown> {
  const entries = Object.entries(value).slice(0, MAX_OBJECT_KEYS);
  return Object.fromEntries(
    entries.map(([key, item]) => [key, sanitizeValue(key, item, depth)]),
  );
}

function sanitizeValue(key: string, value: unknown, depth: number): unknown {
  if (isSensitiveKey(key)) {
    return REDACTED;
  }
  if (typeof value === 'string') {
    return isPathKey(key) ? summarizePath(value) : truncate(value);
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    if (
      value.length <= 8 &&
      value.every((item) =>
        ['string', 'number', 'boolean'].includes(typeof item),
      )
    ) {
      return value.map((item, index) =>
        sanitizeValue(`${key}.${index}`, item, depth + 1),
      );
    }
    return {
      itemCount: value.length,
      items: value
        .slice(0, 8)
        .map((item, index) =>
          sanitizeValue(`${key}.${index}`, item, depth + 1),
        ),
    };
  }
  if (typeof value === 'object') {
    if (depth >= 2) {
      return '[object]';
    }
    return sanitizeObject(value as Record<string, unknown>, depth + 1);
  }
  return String(value);
}

function isSensitiveKey(key: string): boolean {
  return /token|secret|password|passwd|cookie|authorization|credential|storage.?state/i.test(
    key,
  );
}

function isPathKey(key: string): boolean {
  return /path|dir|directory|root|file/i.test(key);
}

function summarizePath(value: string): string {
  const normalized = value.replaceAll('\\', sep);
  const name = basename(normalized);
  const parent = basename(dirname(normalized));
  return parent && parent !== '.' ? `${parent}${sep}${name}` : name;
}

function truncate(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_STRING_LENGTH - 3)}...`;
}

function sanitizeDiagnosticMessage(value: string): string {
  return truncate(
    value.replace(
      /(token|secret|password|passwd|cookie|authorization|credential)=([^&\s]+)/gi,
      '$1=[redacted]',
    ),
  );
}

function dropUndefined(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
}
