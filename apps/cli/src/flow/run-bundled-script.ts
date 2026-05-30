import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { errAsync, ResultAsync } from 'neverthrow';
import type { ScriptPackage } from '../domain/script-catalog';
import type { CliContext } from '../runtime/cli-context';
import { type CliError, isCliCommandError } from '../runtime/cli-error';

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

  return ResultAsync.fromPromise(import(href), (e) => ({
    kind: 'load' as const,
    message: e instanceof Error ? e.message : String(e),
  })).andThen((mod) => {
    const fn = (mod as { default?: unknown }).default;
    if (typeof fn !== 'function') {
      return errAsync({
        kind: 'no_default_export' as const,
        message:
          'script entry must default-export a function (see script-package contract)',
      });
    }
    const run = fn as BundledScriptMain;
    return ResultAsync.fromPromise(Promise.resolve(run(args, context)), (e) => {
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
    });
  });
}
