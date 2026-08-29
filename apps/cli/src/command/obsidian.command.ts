import { join } from 'node:path';
import { confirm, isCancel, text as promptText, select } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  ObsidianAgentsConfigError,
  type ObsidianAgentsProfile,
  readObsidianAgentsConfig,
  selectObsidianAgentsProfile,
} from '../domain/obsidian-agents-config';
import {
  applyObsidianAgentsSetup,
  createObsidianAgentsSetupPlan,
  inspectObsidianAgentsStatus,
  ObsidianAgentsServiceError,
  type ObsidianAgentsSetupInput,
  type ObsidianAgentsStatus,
} from '../domain/obsidian-agents-service';
import {
  createObsidianAgentsDataPaths,
  type ObsidianAgentsDataPaths,
} from '../infra/obsidian-agents-paths';
import { type CliContext, cliContractArgs } from '../runtime/cli-context';
import { type CliError, createCliError } from '../runtime/cli-error';
import {
  type ObservedCliCommandScope,
  runObservedCliCommand,
} from '../runtime/command-diagnostics';
import {
  processOutput,
  writeCommandError,
  writeHumanStatus,
  writeJsonValue,
} from '../runtime/output';

const commonArgs = {
  ...cliContractArgs,
  profile: {
    type: 'string',
    description: 'Obsidian agents profile id',
  },
  vault: {
    type: 'string',
    description: 'Obsidian vault path',
  },
  sourcePath: {
    type: 'string',
    description: 'Visible Agents source directory inside the vault',
  },
  dataRoot: {
    type: 'string',
    description: 'Override the local CthuTool chc data directory',
  },
  home: {
    type: 'string',
    description: 'Override the user home directory',
  },
  yes: {
    type: 'boolean',
    description: 'Confirm setup mutations without prompting',
  },
} as const;

type ObsidianArgs = {
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
  readonly profile?: unknown;
  readonly vault?: unknown;
  readonly sourcePath?: unknown;
  readonly dataRoot?: unknown;
  readonly home?: unknown;
  readonly yes?: unknown;
};

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function createDataPaths(args: ObsidianArgs): ObsidianAgentsDataPaths {
  return createObsidianAgentsDataPaths({
    dataRoot: getStringArg(args.dataRoot),
    homeRoot: getStringArg(args.home),
  });
}

async function runObservedObsidianSubcommand(
  subcommand: string,
  args: ObsidianArgs,
  run: (scope: ObservedCliCommandScope) => Promise<void>,
): Promise<void> {
  await runObservedCliCommand(
    args,
    { command: 'obsidian agents', subcommand },
    async (scope) => {
      try {
        await run(scope);
      } catch (error) {
        const cliError = toObsidianCliError(error);
        scope.fail(cliError);
        if (scope.context.json) {
          writeJsonValue(processOutput, {
            ok: false,
            command: `obsidian agents ${subcommand}`,
            error: { code: cliError.code, message: cliError.message },
          });
        } else {
          writeCommandError(scope.context, processOutput, cliError);
        }
        process.exitCode = cliError.exitCode;
        throw cliError;
      }
    },
  );
}

async function runSetup(
  args: ObsidianArgs,
  scope: ObservedCliCommandScope,
): Promise<void> {
  const paths = createDataPaths(args);
  const config = await readObsidianAgentsConfig(paths);
  const current = config
    ? selectObsidianAgentsProfile(config, getStringArg(args.profile))
    : undefined;
  const interactive = scope.context.interactive && !scope.context.json;
  const input = await collectSetupInput(args, current, interactive);
  if (!input) {
    writeSetupResult(scope.context, { status: 'cancelled' });
    process.exitCode = 0;
    return;
  }

  const plan = await createObsidianAgentsSetupPlan(paths, input);
  if (!scope.context.json && !scope.context.quiet) {
    writeHumanStatus(
      scope.context,
      processOutput,
      pc.cyan('Obsidian agents setup'),
    );
    writeHumanStatus(
      scope.context,
      processOutput,
      `profile: ${plan.profile.id}`,
    );
    writeHumanStatus(
      scope.context,
      processOutput,
      `vault: ${plan.profile.vaultPath}`,
    );
    writeHumanStatus(
      scope.context,
      processOutput,
      `source: ${plan.profile.sourcePath}`,
    );
    writeHumanStatus(
      scope.context,
      processOutput,
      `.agents: ${plan.profile.agentsPath}`,
    );
    writeHumanStatus(scope.context, processOutput, 'scope: vault-local');
    writeHumanStatus(
      scope.context,
      processOutput,
      'consistency: Obsidian Sync (eventual)',
    );
    for (const action of plan.actions) {
      writeHumanStatus(scope.context, processOutput, `- ${action}`);
    }
  }

  if (plan.requiresConfirmation && args.yes !== true) {
    if (!interactive) {
      throw createCliError(
        'invalid_option',
        'Setup would change the vault topology. Use --yes in non-interactive mode.',
      );
    }
    const answer = await confirm({
      message: 'Apply this Obsidian agents setup?',
      initialValue: false,
    });
    if (isCancel(answer) || answer !== true) {
      writeSetupResult(scope.context, { status: 'cancelled' });
      process.exitCode = 0;
      return;
    }
  }

  const result = await applyObsidianAgentsSetup(paths, plan);
  writeSetupResult(scope.context, { status: 'configured', ...result });
  process.exitCode = 0;
}

async function runStatus(
  args: ObsidianArgs,
  scope: ObservedCliCommandScope,
): Promise<void> {
  const result = await inspectObsidianAgentsStatus({
    paths: createDataPaths(args),
    profileId: getStringArg(args.profile),
  });
  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: 'obsidian agents status',
      result,
    });
  } else {
    writeStatusHuman(scope.context, result);
  }
  process.exitCode = 0;
}

async function collectSetupInput(
  args: ObsidianArgs,
  current: ObsidianAgentsProfile | undefined,
  interactive: boolean,
): Promise<ObsidianAgentsSetupInput | undefined> {
  const suppliedProfile = getStringArg(args.profile);
  const suppliedVault = getStringArg(args.vault);
  const suppliedSource = getStringArg(args.sourcePath);
  if (!interactive) {
    const vaultPath = suppliedVault ?? current?.vaultPath;
    if (!vaultPath) {
      throw createCliError(
        'missing_required_argument',
        'Setup requires --vault in non-interactive mode when no profile exists.',
      );
    }
    return {
      id: suppliedProfile ?? current?.id ?? 'obsidian-main',
      vaultPath,
      sourcePath:
        suppliedSource ?? current?.sourcePath ?? join(vaultPath, 'Agents'),
    };
  }

  if (current) {
    const choice = await select<'keep' | 'edit'>({
      message: `Existing profile "${current.id}" found.`,
      options: [
        { value: 'keep', label: 'Keep current configuration' },
        { value: 'edit', label: 'Edit configuration' },
      ],
      initialValue: 'keep',
    });
    if (isCancel(choice)) return undefined;
    if (
      choice === 'keep' &&
      !suppliedVault &&
      !suppliedSource &&
      !suppliedProfile
    ) {
      return current;
    }
  }

  const id =
    suppliedProfile ??
    current?.id ??
    (await promptString('Profile id', 'obsidian-main', (value) =>
      /^[a-z0-9][a-z0-9_-]*$/u.test(value.trim())
        ? undefined
        : 'Use lowercase letters, numbers, hyphens, or underscores.',
    ));
  if (!id) return undefined;
  const vaultPath =
    suppliedVault ??
    (await promptString('Obsidian vault path', current?.vaultPath, (value) =>
      value.trim() ? undefined : 'A vault path is required.',
    ));
  if (!vaultPath) return undefined;
  const sourcePath =
    suppliedSource ??
    (await promptString(
      'Visible Agents source path',
      current?.sourcePath ?? join(vaultPath, 'Agents'),
      (value) => (value.trim() ? undefined : 'A source path is required.'),
    ));
  if (!sourcePath) return undefined;
  return { id, vaultPath, sourcePath };
}

async function promptString(
  message: string,
  initialValue: string | undefined,
  validate: (value: string) => string | undefined,
): Promise<string | undefined> {
  const answer = await promptText({ message, initialValue, validate });
  return isCancel(answer) ? undefined : answer.trim();
}

function writeSetupResult(
  context: CliContext,
  result: Record<string, unknown>,
): void {
  if (context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: 'obsidian agents setup',
      result,
    });
    return;
  }
  if (result.status === 'cancelled') {
    writeHumanStatus(context, processOutput, 'Setup cancelled.');
    return;
  }
  writeHumanStatus(
    context,
    processOutput,
    pc.green('Obsidian agents configured.'),
  );
  const profile = result.profile as ObsidianAgentsProfile | undefined;
  if (profile) {
    writeHumanStatus(context, processOutput, `source: ${profile.sourcePath}`);
    writeHumanStatus(context, processOutput, `.agents: ${profile.agentsPath}`);
  }
}

function writeStatusHuman(
  context: CliContext,
  result: ObsidianAgentsStatus,
): void {
  writeHumanStatus(context, processOutput, pc.cyan('Obsidian agents status'));
  if (!result.configured) {
    writeHumanStatus(context, processOutput, 'configuration: missing');
    writeHumanStatus(context, processOutput, 'run: chc obsidian agents setup');
    return;
  }
  writeHumanStatus(
    context,
    processOutput,
    `profile: ${result.profile?.id ?? 'unknown'}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `vault: ${check(result.paths.vaultExists)} ${result.profile?.vaultPath ?? ''}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `source: ${check(result.paths.sourceExists && result.paths.sourceInsideVault)} ${result.profile?.sourcePath ?? ''}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `.agents: ${check(result.link.status === 'correct')} ${result.link.status}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `link type: ${result.link.type ?? 'none'}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `resolved target: ${result.link.resolvedTarget ?? 'unavailable'}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `skills: ${check(result.paths.skillsExists)}; state: ${check(result.paths.stateExists)}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `legacy Git metadata: ${result.legacy.gitMetadata ? 'present' : 'absent'}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `consistency: ${result.consistency.provider} (${result.consistency.model})`,
  );
  for (const warning of result.warnings) {
    writeHumanStatus(context, processOutput, `warning: ${warning}`);
  }
}

function check(value: boolean): string {
  return value ? pc.green('OK') : pc.red('FAIL');
}

function toObsidianCliError(error: unknown): CliError {
  if (error instanceof ObsidianAgentsServiceError) {
    return createCliError(
      mapServiceError(error.code),
      error.message,
      error.exitCode,
    );
  }
  if (error instanceof ObsidianAgentsConfigError) {
    return createCliError(
      'obsidian_agents_invalid_configuration',
      error.message,
    );
  }
  if (error instanceof Error && 'code' in error && 'exitCode' in error) {
    return error as CliError;
  }
  return createCliError(
    'obsidian_agents_link_failed',
    error instanceof Error ? error.message : String(error),
  );
}

function mapServiceError(
  code: ObsidianAgentsServiceError['code'],
): CliError['code'] {
  switch (code) {
    case 'not_configured':
      return 'obsidian_agents_not_configured';
    case 'invalid_configuration':
      return 'obsidian_agents_invalid_configuration';
    case 'setup_required':
      return 'obsidian_agents_setup_required';
    case 'conflict':
      return 'obsidian_agents_conflict';
    case 'filesystem_failed':
      return 'obsidian_agents_link_failed';
  }
}

export const obsidianCommand = defineCommand({
  meta: {
    name: 'obsidian',
    description: 'Manage Obsidian-synchronized vault Skills and state.',
  },
  subCommands: {
    agents: defineCommand({
      meta: {
        name: 'agents',
        description: 'Manage the vault Agents source and .agents link.',
      },
      subCommands: {
        setup: defineCommand({
          meta: {
            name: 'setup',
            description: 'Configure or repair the vault-local .agents link.',
          },
          args: commonArgs,
          async run({ args }) {
            const typedArgs = args as unknown as ObsidianArgs;
            await runObservedObsidianSubcommand(
              'setup',
              typedArgs,
              async (scope) => {
                await runSetup(typedArgs, scope);
              },
            );
          },
        }),
        status: defineCommand({
          meta: {
            name: 'status',
            description: 'Show local Agents source and .agents link health.',
          },
          args: commonArgs,
          async run({ args }) {
            const typedArgs = args as unknown as ObsidianArgs;
            await runObservedObsidianSubcommand(
              'status',
              typedArgs,
              async (scope) => {
                await runStatus(typedArgs, scope);
              },
            );
          },
        }),
      },
    }),
  },
});
