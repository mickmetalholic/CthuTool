import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { errAsync, ResultAsync } from 'neverthrow';
import type { ScriptPackage } from '../domain/script-catalog';
import type { CliContext } from '../runtime/cli-context';
import { type CliError, isCliCommandError } from '../runtime/cli-error';
import {
  type CliDiagnostics,
  summarizeScriptArgs,
} from '../runtime/observability';

export type RunBundledScriptError =
  | { readonly kind: 'load'; readonly message: string }
  | { readonly kind: 'no_default_export'; readonly message: string }
  | {
      readonly kind: 'execution';
      readonly message: string;
      readonly cliError?: CliError;
    };

export type BundledScriptContext = {
  readonly cli: CliContext;
  readonly diagnostics?: CliDiagnostics;
};

export type BundledScriptMain<TArgs = Record<string, unknown>> = (
  args: TArgs,
  context: BundledScriptContext,
) => void | Promise<void>;

/**
 * Dynamically imports a package entry and invokes its default export (sync or async).
 *
 * @param pkg Resolved script package from discovery
 */
export function runBundledScript(
  pkg: ScriptPackage,
  args: Record<string, unknown>,
  context: BundledScriptContext,
): ResultAsync<void, RunBundledScriptError> {
  const entryPath = join(pkg.rootPath, pkg.entryRelative);
  const href = pathToFileURL(entryPath).href;
  const startedAt = Date.now();
  const diagnostics = context.diagnostics?.child({ scriptId: pkg.id });

  diagnostics?.emit({
    level: 'info',
    event: 'cli.script_started',
    phase: 'start',
    scriptId: pkg.id,
    details: {
      entryPath,
      scriptArgs: summarizeScriptArgs(args),
    },
  });

  return ResultAsync.fromPromise(import(href), (e) => ({
    kind: 'load' as const,
    message: e instanceof Error ? e.message : String(e),
  }))
    .andThen((mod) => {
      const fn = (mod as { default?: unknown }).default;
      if (typeof fn !== 'function') {
        return errAsync({
          kind: 'no_default_export' as const,
          message:
            'script entry must default-export a function (see script-package contract)',
        });
      }
      const run = fn as BundledScriptMain;
      return ResultAsync.fromPromise(
        Promise.resolve(run(args, context)),
        (e) => {
          if (isCliCommandError(e)) {
            return {
              kind: 'execution' as const,
              message: e.message,
              cliError: e,
            };
          }
          return {
            kind: 'execution' as const,
            message: e instanceof Error ? e.message : String(e),
          };
        },
      );
    })
    .map(() => {
      diagnostics?.emit({
        level: 'info',
        event: 'cli.script_completed',
        phase: 'complete',
        scriptId: pkg.id,
        durationMs: Math.max(0, Date.now() - startedAt),
      });
      return undefined;
    })
    .mapErr((error) => {
      if (error.kind === 'execution' && error.cliError) {
        diagnostics?.emit({
          level: 'error',
          event: 'cli.script_failed',
          phase: 'execution',
          scriptId: pkg.id,
          durationMs: Math.max(0, Date.now() - startedAt),
          exitCode: error.cliError.exitCode,
          errorCode: error.cliError.code,
          message: error.cliError.message,
          details: { scriptArgs: summarizeScriptArgs(args) },
        });
        return error;
      }
      diagnostics?.emit({
        level: 'error',
        event: 'cli.script_failed',
        phase: error.kind,
        scriptId: pkg.id,
        durationMs: Math.max(0, Date.now() - startedAt),
        message: error.message,
        details: { scriptArgs: summarizeScriptArgs(args) },
      });
      return error;
    });
}
