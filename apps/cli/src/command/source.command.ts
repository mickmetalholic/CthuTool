import { isCancel, select } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  type CliSourceCandidate,
  CliSourceError,
  type CliSourceInventory,
  type CliSourceManagerDeps,
  type CliSourceSwitchResult,
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
import {
  actionableCliSourceCandidates,
  presentCliSourceCandidate,
  sourceChoiceLabel,
  sourcePresentationDescription,
} from './source-presentation';

export type SourceCommandInteraction = {
  readonly chooseSource: (
    candidates: readonly CliSourceCandidate[],
    home: string,
  ) => Promise<string | undefined>;
};

export type SourceCommandDeps = {
  readonly manager: CliSourceManagerDeps;
  readonly interaction: SourceCommandInteraction;
  readonly isTty: () => boolean;
  readonly discoverSources: (
    manager: CliSourceManagerDeps,
  ) => Promise<CliSourceInventory>;
  readonly switchSource: (
    selector: string,
    manager: CliSourceManagerDeps,
  ) => Promise<CliSourceSwitchResult>;
};

const defaultInteraction: SourceCommandInteraction = {
  async chooseSource(candidates, home) {
    const answer = await select<string>({
      message: 'Choose the source for global chc',
      options: candidates.map((candidate) => ({
        value: candidate.id,
        label: sourceChoiceLabel(candidate, home),
      })),
    });
    return isCancel(answer) ? undefined : answer;
  },
};

const defaultDeps: SourceCommandDeps = {
  manager: createCliSourceManagerDeps(),
  interaction: defaultInteraction,
  isTty: () => process.stdin.isTTY === true,
  discoverSources: discoverCliSources,
  switchSource: switchCliSource,
};

const useArgs = {
  ...cliContractArgs,
  selector: {
    type: 'positional',
    description: 'local, remote, ., a worktree id, or a checkout path',
    required: false,
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

function writeSourceCandidate(
  candidate: CliSourceCandidate,
  home: string,
): void {
  const presentation = presentCliSourceCandidate(candidate, home);
  const marker =
    presentation.state === 'active'
      ? pc.green('●')
      : presentation.state === 'ready'
        ? '○'
        : presentation.state === 'not installed'
          ? '◌'
          : pc.yellow('×');
  processOutput.stdout.write(
    `${marker} ${presentation.selector.padEnd(23)} ${sourcePresentationDescription(presentation)}\n`,
  );
  processOutput.stdout.write(`  ${presentation.displayPath}\n`);
  if (presentation.hint) {
    processOutput.stdout.write(`  ${pc.yellow(presentation.hint)}\n`);
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
            const inventory = await deps.discoverSources(deps.manager);
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
              processOutput.stdout.write('\n');
              for (const candidate of inventory.candidates) {
                writeSourceCandidate(candidate, deps.manager.home());
                processOutput.stdout.write('\n');
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
        { isTty: deps.isTty },
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
    async run({ args, rawArgs }) {
      await runObservedCliCommand(
        args,
        { command: 'source', subcommand: 'use' },
        async (scope) => {
          if (
            rawArgs.some(
              (argument) =>
                argument === '--bootstrap' ||
                argument.startsWith('--bootstrap='),
            )
          ) {
            failSourceCommand(
              scope,
              createCliError(
                'invalid_option',
                'Unknown option: --bootstrap. Select remote directly; use `chc update` to update an existing managed checkout.',
              ),
              { phase: 'validation' },
            );
            return;
          }
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
              const inventory = await deps.discoverSources(deps.manager);
              selector = await deps.interaction.chooseSource(
                actionableCliSourceCandidates(
                  inventory.candidates,
                  deps.manager.home(),
                ),
                deps.manager.home(),
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
            const result = await deps.switchSource(selector, deps.manager);
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
            });
          }
        },
        { isTty: deps.isTty },
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
        { isTty: deps.isTty },
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
