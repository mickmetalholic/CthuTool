import { isCancel, select } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  type CliSourceCandidate,
  CliSourceError,
  type CliSourceManagerDeps,
  createCliSourceManagerDeps,
  discoverCliSources,
  getCliSourceSelectorCandidates,
  registerCliSource,
  switchCliSource,
} from '../domain/cli-source-manager';
import { cliContractArgs } from '../runtime/cli-context';
import {
  type CliError,
  createCliError,
  isCliCommandError,
} from '../runtime/cli-error';
import {
  type ObservedCliCommandScope,
  runObservedCliCommand,
} from '../runtime/command-diagnostics';
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
  registerPositionalCandidates,
} from './command-discovery';

export type SourceCommandInteraction = {
  readonly chooseSource: (
    candidates: readonly CliSourceCandidate[],
  ) => Promise<string | undefined>;
};

export type SourceCommandDeps = {
  readonly manager: CliSourceManagerDeps;
  readonly interaction: SourceCommandInteraction;
};

const defaultInteraction: SourceCommandInteraction = {
  async chooseSource(candidates) {
    const answer = await select<string>({
      message: 'Choose the source for global chc',
      options: candidates.map((candidate) => ({
        value: candidate.id,
        label: sourceChoiceLabel(candidate),
      })),
    });
    return isCancel(answer) ? undefined : answer;
  },
};

const defaultDeps: SourceCommandDeps = {
  manager: createCliSourceManagerDeps(),
  interaction: defaultInteraction,
};

const useArgs = {
  ...cliContractArgs,
  selector: {
    type: 'positional',
    description: 'local, remote, ., a worktree id, or a checkout path',
    required: false,
  },
  bootstrap: {
    type: 'boolean',
    description: 'Create or safely refresh the managed source explicitly',
  },
} as const;

const registerArgs = {
  ...cliContractArgs,
  path: {
    type: 'positional',
    description: 'CthuTool main checkout or linked worktree path',
    required: false,
  },
} as const;

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function sourceChoiceLabel(candidate: CliSourceCandidate): string {
  const ref = candidate.branch ?? (candidate.detached ? 'detached' : 'unknown');
  return `${candidate.kind} · ${ref} · ${candidate.path}`;
}

function sourceStatusLabel(candidate: CliSourceCandidate): string {
  const parts: string[] = [candidate.kind];
  if (candidate.branch) parts.push(candidate.branch);
  else if (candidate.detached) parts.push('detached');
  if (candidate.dirty === true) parts.push('dirty');
  if (!candidate.bundlePresent) parts.push('bundle missing');
  if (!candidate.available) parts.push('unavailable');
  return parts.join(', ');
}

function writeSourceCandidate(candidate: CliSourceCandidate): void {
  const marker = candidate.active ? pc.green('●') : ' ';
  processOutput.stdout.write(
    `${marker} ${candidate.id.padEnd(23)} ${sourceStatusLabel(candidate)}\n`,
  );
  processOutput.stdout.write(`  ${candidate.path}\n`);
  if (candidate.reason) {
    processOutput.stdout.write(`  ${pc.yellow(candidate.reason)}\n`);
  }
}

function toCliSourceError(error: unknown): CliError {
  if (isCliCommandError(error)) return error;
  if (error instanceof CliSourceError) {
    return createCliError(error.code, error.message);
  }
  return createCliError(
    'source_switch_failed',
    error instanceof Error ? error.message : 'Source operation failed.',
  );
}

function failSourceCommand(
  scope: ObservedCliCommandScope,
  error: unknown,
  details: Record<string, unknown> = {},
): void {
  const cliError = toCliSourceError(error);
  scope.fail(cliError, { details });
  writeCommandError(scope.context, processOutput, cliError);
  process.exitCode = cliError.exitCode;
}

function createSourceListCommand(deps: SourceCommandDeps) {
  return defineCommand({
    meta: {
      name: 'list',
      description: 'List the active, local worktree, and managed sources.',
    },
    args: cliContractArgs,
    async run({ args }) {
      await runObservedCliCommand(
        args,
        { command: 'source', subcommand: 'list' },
        async (scope) => {
          try {
            const inventory = await discoverCliSources(deps.manager);
            if (scope.context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: 'source list',
                active: inventory.active,
                candidates: inventory.candidates,
                warnings: inventory.warnings,
              });
            } else if (!scope.context.quiet) {
              writeHumanStatus(
                scope.context,
                processOutput,
                pc.cyan('CthuTool sources'),
              );
              for (const candidate of inventory.candidates) {
                writeSourceCandidate(candidate);
              }
            }
            if (!scope.context.quiet) {
              for (const warning of inventory.warnings) {
                writeWarning(processOutput, pc.yellow(warning));
              }
            }
            process.exitCode = 0;
          } catch (error) {
            failSourceCommand(scope, error, { phase: 'discovery' });
          }
        },
      );
    },
  });
}

function createSourceCurrentCommand(deps: SourceCommandDeps) {
  return defineCommand({
    meta: {
      name: 'current',
      description: 'Show the source that provides the running chc command.',
    },
    args: cliContractArgs,
    async run({ args }) {
      await runObservedCliCommand(
        args,
        { command: 'source', subcommand: 'current' },
        async (scope) => {
          try {
            const inventory = await discoverCliSources(deps.manager);
            if (scope.context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: 'source current',
                source: inventory.active,
              });
            } else {
              writeHumanStatus(
                scope.context,
                processOutput,
                pc.cyan('CthuTool source'),
              );
              if (!scope.context.quiet) writeSourceCandidate(inventory.active);
            }
            process.exitCode = 0;
          } catch (error) {
            failSourceCommand(scope, error, { phase: 'discovery' });
          }
        },
      );
    },
  });
}

function shouldOfferSourceSelectors({
  completedWords,
  path,
}: CandidateProviderContext): boolean {
  const tail = completedWords.slice(path.length);
  return !tail.some((word) => !word.startsWith('-'));
}

function createSourceUseCommand(deps: SourceCommandDeps) {
  const command = defineCommand({
    meta: {
      name: 'use',
      description: 'Switch global chc to a local, worktree, or managed source.',
    },
    args: useArgs,
    async run({ args }) {
      await runObservedCliCommand(
        args,
        { command: 'source', subcommand: 'use' },
        async (scope) => {
          let selector = getStringArg(args.selector);
          if (!selector) {
            if (!scope.context.interactive || scope.context.json) {
              failSourceCommand(
                scope,
                createCliError(
                  'missing_required_argument',
                  'source selector is required in non-interactive mode (use: chc source use <selector>)',
                ),
                { phase: 'selection' },
              );
              return;
            }
            try {
              const inventory = await discoverCliSources(deps.manager);
              selector = await deps.interaction.chooseSource(
                inventory.candidates.filter(
                  (candidate) =>
                    candidate.available ||
                    (args.bootstrap === true && candidate.kind === 'managed'),
                ),
              );
            } catch (error) {
              failSourceCommand(scope, error, { phase: 'discovery' });
              return;
            }
            if (!selector) {
              failSourceCommand(
                scope,
                createCliError('invalid_option', 'source selection cancelled'),
                { phase: 'selection' },
              );
              return;
            }
          }

          try {
            const result = await switchCliSource(
              selector,
              { bootstrap: args.bootstrap === true },
              deps.manager,
            );
            if (scope.context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: 'source use',
                result,
              });
            } else {
              const verb =
                result.status === 'already_active'
                  ? 'Already using'
                  : result.status === 'bootstrapped'
                    ? 'Bootstrapped and switched to'
                    : 'Switched to';
              writeHumanStatus(
                scope.context,
                processOutput,
                `${pc.green('✓')} ${verb} ${result.selected.id}`,
              );
              writeHumanStatus(
                scope.context,
                processOutput,
                `  ${result.selected.path}`,
              );
              if (result.selected.kind === 'worktree') {
                writeHumanStatus(
                  scope.context,
                  processOutput,
                  pc.yellow(
                    '  Switch away before deleting this worktree; otherwise restore chc with the public remote installer.',
                  ),
                );
              }
            }
            process.exitCode = 0;
          } catch (error) {
            failSourceCommand(scope, error, {
              phase: 'switch',
              selector,
              bootstrap: args.bootstrap === true,
            });
          }
        },
      );
    },
  });
  return registerPositionalCandidates(command, (context) =>
    shouldOfferSourceSelectors(context)
      ? getCliSourceSelectorCandidates(deps.manager)
      : [],
  );
}

function createSourceRegisterCommand(deps: SourceCommandDeps) {
  return defineCommand({
    meta: {
      name: 'register',
      description: 'Remember a development checkout for local discovery.',
    },
    args: registerArgs,
    async run({ args }) {
      await runObservedCliCommand(
        args,
        { command: 'source', subcommand: 'register' },
        async (scope) => {
          const path = getStringArg(args.path);
          if (!path) {
            failSourceCommand(
              scope,
              createCliError(
                'missing_required_argument',
                'checkout path is required (use: chc source register <path>)',
              ),
              { phase: 'registration' },
            );
            return;
          }
          try {
            const result = await registerCliSource(path, deps.manager);
            if (scope.context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: 'source register',
                result,
              });
            } else {
              writeHumanStatus(
                scope.context,
                processOutput,
                `${pc.green('✓')} Registered local source`,
              );
              writeHumanStatus(
                scope.context,
                processOutput,
                `  ${result.mainRoot}`,
              );
            }
            process.exitCode = 0;
          } catch (error) {
            failSourceCommand(scope, error, {
              phase: 'registration',
              path,
            });
          }
        },
      );
    },
  });
}

export function createSourceCommand(
  overrides: Partial<SourceCommandDeps> = {},
) {
  const deps = { ...defaultDeps, ...overrides };
  const registrations: readonly CliCommandRegistration[] = [
    {
      name: 'list',
      command: createSourceListCommand(deps),
      visibility: 'public',
      bareBehavior: 'run',
    },
    {
      name: 'current',
      command: createSourceCurrentCommand(deps),
      visibility: 'public',
      bareBehavior: 'run',
    },
    {
      name: 'use',
      command: createSourceUseCommand(deps),
      visibility: 'public',
      bareBehavior: 'run',
    },
    {
      name: 'register',
      command: createSourceRegisterCommand(deps),
      visibility: 'public',
      bareBehavior: 'run',
    },
  ];
  return registerCommandGroup(
    defineCommand({
      meta: {
        name: 'source',
        description: 'Discover and switch the source used by global chc.',
      },
      subCommands: buildRegisteredSubCommands(registrations),
    }),
    registrations,
  );
}

export const sourceCommand = createSourceCommand();
