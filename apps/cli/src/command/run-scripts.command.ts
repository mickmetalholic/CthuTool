import { intro, isCancel, select } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import { listSelectable, resolvePackage } from '../domain/script-catalog';
import { runBundledScript } from '../flow/run-bundled-script';
import { getBundledScriptsRoot } from '../infra/bundled-scripts-root';
import { discoverScripts } from '../infra/discover-scripts';
import { cliContractArgs, createCliContext } from '../runtime/cli-context';
import { type CliError, createCliError } from '../runtime/cli-error';
import {
  createCliCommandDiagnostics,
  createCliDiagnostics,
  summarizeScriptArgs,
} from '../runtime/observability';
import {
  processOutput,
  writeCommandError,
  writeWarning,
} from '../runtime/output';

export type SelectableRow = { readonly id: string; readonly title: string };

export type RunScriptsDeps = {
  readonly isInteractive: () => boolean;
  readonly pickScriptId: (
    rows: ReadonlyArray<SelectableRow>,
  ) => Promise<string | undefined>;
};

const defaultDeps: RunScriptsDeps = {
  isInteractive: () => process.stdin.isTTY === true,
  pickScriptId: async (rows) => {
    intro(pc.cyan('▶ Script Selection'));
    const choice = await select({
      message: 'Choose a bundled script to run',
      options: rows.map((o) => ({
        value: o.id,
        label: `${o.title} (${o.id})`,
      })),
    });
    if (isCancel(choice)) {
      return undefined;
    }
    return choice as string;
  },
};

function resolveExplicitId(args: {
  readonly id?: string;
  readonly script?: string;
}): string | undefined {
  const fromFlag = typeof args.script === 'string' ? args.script.trim() : '';
  const fromPos = typeof args.id === 'string' ? args.id.trim() : '';
  const resolved = fromFlag || fromPos;
  return resolved.length > 0 ? resolved : undefined;
}

function toScriptArgs(args: Record<string, unknown>): Record<string, unknown> {
  const skipped = new Set([
    '_',
    'id',
    'script',
    'json',
    'quiet',
    'noInteractive',
    'no-interactive',
  ]);
  return Object.fromEntries(
    Object.entries(args).filter(([key]) => !skipped.has(key)),
  );
}

export const createScriptsCommand = (deps: RunScriptsDeps = defaultDeps) =>
  defineCommand({
    meta: {
      name: 'scripts',
      description: [
        'Discover and run bundled scripts under apps/cli/src/scripts/<id>/ (script.json + index.ts).',
        '',
        'Examples:',
        '  chc scripts hello-world',
        '  chc scripts --script hello-world',
        '  bun run apps/cli/src/scripts/hello-world/index.ts',
      ].join('\n'),
    },
    args: {
      ...cliContractArgs,
      id: {
        type: 'positional',
        description: 'Script id (folder name under apps/cli/src/scripts/)',
        required: false,
      },
      script: {
        type: 'string',
        description: 'Same as positional id (for non-interactive CI)',
        alias: 's',
        valueHint: 'id',
      },
    },
    async run({ args }) {
      const context = createCliContext(args, { isTty: deps.isInteractive });
      const commandDiagnostics = createCliCommandDiagnostics(
        context,
        processOutput,
        { command: 'scripts' },
      );
      const diagnostics = createCliDiagnostics(context, processOutput, {
        command: 'scripts',
      });
      const fail = (error: CliError, details?: Record<string, unknown>) => {
        commandDiagnostics.fail(error, { details });
        writeCommandError(context, processOutput, error);
        process.exitCode = error.exitCode;
      };
      const root = getBundledScriptsRoot();
      const discovered = await discoverScripts(root);
      if (discovered.isErr()) {
        const error = createCliError(
          'discovery_failed',
          discovered.error.message,
        );
        fail(error, { phase: 'discovery', scriptsRoot: root });
        return;
      }

      const catalog = discovered.value;
      diagnostics.emit({
        level: 'debug',
        event: 'cli.scripts_discovered',
        phase: 'discovery',
        details: {
          packageCount: catalog.packages.length,
          warningCount: catalog.warnings.length,
        },
      });
      for (const w of catalog.warnings) {
        writeWarning(processOutput, pc.yellow(`${w.path}: ${w.message}`));
        diagnostics.emit({
          level: 'warn',
          event: 'cli.script_discovery_warning',
          phase: 'discovery',
          details: {
            message: w.message,
            path: w.path,
          },
        });
      }

      if (catalog.packages.length === 0) {
        const error = createCliError(
          'discovery_failed',
          'no valid bundled script packages found (see apps/cli/src/scripts/)',
        );
        fail(error, { phase: 'discovery', scriptsRoot: root });
        return;
      }

      const explicitId = resolveExplicitId(args);
      let targetId = explicitId;

      if (!targetId) {
        if (!context.interactive) {
          const error = createCliError(
            'missing_required_argument',
            'script id is required in non-interactive mode (use: chc scripts <id> or --script <id>)',
          );
          fail(error, { phase: 'selection' });
          return;
        }

        const options = listSelectable(catalog);
        if (options.length === 1) {
          const [only] = options;
          targetId = only.id;
          diagnostics.emit({
            level: 'info',
            event: 'cli.script_selected',
            phase: 'selection',
            scriptId: targetId,
            details: { selectionMode: 'single-option' },
          });
        } else {
          const choice = await deps.pickScriptId(options);
          if (choice === undefined) {
            const error = createCliError(
              'invalid_option',
              'selection cancelled',
            );
            fail(error, { phase: 'selection' });
            return;
          }
          targetId = choice;
          diagnostics.emit({
            level: 'info',
            event: 'cli.script_selected',
            phase: 'selection',
            scriptId: targetId,
            details: { selectionMode: 'interactive' },
          });
        }
      } else {
        diagnostics.emit({
          level: 'info',
          event: 'cli.script_selected',
          phase: 'selection',
          scriptId: targetId,
          details: {
            selectionMode: explicitId === args.script ? 'flag' : 'positional',
          },
        });
      }

      const resolved = resolvePackage(catalog, targetId);
      if (resolved.isErr()) {
        const error =
          resolved.error.kind === 'not_found'
            ? createCliError(
                'unknown_selection',
                `unknown script id: ${resolved.error.id}`,
              )
            : createCliError(
                'ambiguous_selection',
                `ambiguous script id: ${resolved.error.id}`,
              );
        fail(error, {
          phase: 'selection',
          requestedScriptId: resolved.error.id,
        });
        return;
      }

      const executed = await runBundledScript(
        resolved.value,
        toScriptArgs(args),
        {
          cli: context,
          diagnostics: diagnostics.child({
            scriptId: resolved.value.id,
          }),
        },
      );
      if (executed.isErr()) {
        const e = executed.error;
        const error =
          e.kind === 'load'
            ? createCliError('script_load_failed', e.message)
            : e.kind === 'no_default_export'
              ? createCliError('script_load_failed', e.message)
              : (e.cliError ??
                createCliError('script_execution_failed', e.message));
        fail(error, {
          phase: e.kind,
          scriptId: resolved.value.id,
          scriptArgs: summarizeScriptArgs(toScriptArgs(args)),
        });
        return;
      }

      commandDiagnostics.complete({
        details: {
          scriptId: resolved.value.id,
          scriptArgs: summarizeScriptArgs(toScriptArgs(args)),
        },
      });
      process.exitCode = 0;
    },
  });

export const scriptsCommand = createScriptsCommand();
