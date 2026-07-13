import { intro, isCancel, select } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import { listSelectable, resolvePackage } from '../domain/script-catalog';
import { runBundledScript } from '../flow/run-bundled-script';
import {
  formatBundledScriptCatalog,
  getBundledScriptIdCandidates,
  loadBundledScriptCatalog,
  renderBundledScriptHelpAppendix,
  toBundledScriptCatalogRows,
} from '../infra/bundled-script-catalog';
import { getBundledScriptsRoot } from '../infra/bundled-scripts-root';
import { cliContractArgs, createCliContext } from '../runtime/cli-context';
import { type CliError, createCliError } from '../runtime/cli-error';
import { runObservedCliCommand } from '../runtime/command-diagnostics';
import {
  createCliCommandDiagnostics,
  createCliDiagnostics,
  summarizeScriptArgs,
} from '../runtime/observability';
import {
  processOutput,
  writeCommandError,
  writeHumanStatus,
  writeJsonValue,
  writeWarning,
} from '../runtime/output';
import {
  buildRegisteredSubCommands,
  type CandidateProviderContext,
  type CliCommandRegistration,
  registerCommandGroup,
  registerCommandHelpAppendix,
  registerPositionalCandidates,
} from './command-discovery';

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

const scriptRunnerArgs = {
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
} as const;

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

function shouldOfferScriptIds({
  completedWords,
  path,
}: CandidateProviderContext): boolean {
  const tail = completedWords.slice(path.length);
  const last = tail.at(-1);
  if (last === '--script' || last === '-s') {
    return true;
  }
  return !tail.some((word) => !word.startsWith('-'));
}

async function scriptIdCandidates(context: CandidateProviderContext) {
  return shouldOfferScriptIds(context)
    ? await getBundledScriptIdCandidates()
    : [];
}

export function normalizeScriptsArgs(
  args: readonly string[],
): readonly string[] {
  const [first] = args;
  if (
    !first ||
    first === 'list' ||
    first === 'run' ||
    first === '--help' ||
    first === '-h'
  ) {
    return args;
  }
  return ['run', ...args];
}

async function executeBundledScript(
  args: Record<string, unknown>,
  deps: RunScriptsDeps,
): Promise<void> {
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
  const discovered = await loadBundledScriptCatalog();
  if (discovered.isErr()) {
    const error = createCliError('discovery_failed', discovered.error.message);
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
  for (const warning of catalog.warnings) {
    writeWarning(
      processOutput,
      pc.yellow(`${warning.path}: ${warning.message}`),
    );
    diagnostics.emit({
      level: 'warn',
      event: 'cli.script_discovery_warning',
      phase: 'discovery',
      details: {
        message: warning.message,
        path: warning.path,
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
        'script id is required in non-interactive mode (use: chc scripts run <id>, chc scripts <id>, or --script <id>)',
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
        const error = createCliError('invalid_option', 'selection cancelled');
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

  const executed = await runBundledScript(resolved.value, toScriptArgs(args), {
    cli: context,
    diagnostics: diagnostics.child({
      scriptId: resolved.value.id,
    }),
  });
  if (executed.isErr()) {
    const error =
      executed.error.kind === 'load' ||
      executed.error.kind === 'no_default_export'
        ? createCliError('script_load_failed', executed.error.message)
        : (executed.error.cliError ??
          createCliError('script_execution_failed', executed.error.message));
    fail(error, {
      phase: executed.error.kind,
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
}

function createScriptListCommand() {
  return defineCommand({
    meta: {
      name: 'list',
      description: 'List discovered bundled scripts.',
    },
    args: cliContractArgs,
    async run({ args }) {
      await runObservedCliCommand(
        args,
        { command: 'scripts', subcommand: 'list' },
        async ({ context, fail }) => {
          const discovered = await loadBundledScriptCatalog();
          if (discovered.isErr()) {
            const error = createCliError(
              'discovery_failed',
              discovered.error.message,
            );
            fail(error, { details: { phase: 'discovery' } });
            writeCommandError(context, processOutput, error);
            process.exitCode = error.exitCode;
            return;
          }
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: true,
              command: 'scripts list',
              scripts: toBundledScriptCatalogRows(discovered.value),
            });
          } else {
            writeHumanStatus(
              context,
              processOutput,
              formatBundledScriptCatalog(discovered.value),
            );
          }
          process.exitCode = 0;
        },
      );
    },
  });
}

function createScriptRunCommand(deps: RunScriptsDeps) {
  const command = defineCommand({
    meta: {
      name: 'run',
      description: 'Run a discovered bundled script.',
    },
    args: scriptRunnerArgs,
    async run({ args }) {
      await executeBundledScript(args, deps);
    },
  });
  return registerPositionalCandidates(command, scriptIdCandidates);
}

export const createScriptsCommand = (deps: RunScriptsDeps = defaultDeps) => {
  const registrations: readonly CliCommandRegistration[] = [
    {
      name: 'list',
      command: createScriptListCommand(),
      visibility: 'public',
      bareBehavior: 'run',
    },
    {
      name: 'run',
      command: createScriptRunCommand(deps),
      visibility: 'public',
      bareBehavior: 'run',
    },
  ];
  const command = registerCommandGroup(
    defineCommand({
      meta: {
        name: 'scripts',
        description:
          'Discover, list, and run bundled scripts under apps/cli/src/scripts/<id>/.',
      },
      subCommands: buildRegisteredSubCommands(registrations),
    }),
    registrations,
  );
  registerPositionalCandidates(command, scriptIdCandidates);
  return registerCommandHelpAppendix(command, renderBundledScriptHelpAppendix);
};

export const scriptsCommand = createScriptsCommand();
