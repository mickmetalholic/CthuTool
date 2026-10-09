import { join } from 'node:path';
import { confirm, isCancel, text as promptText, select } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  canonicalizeObsidianAgentsProfile,
  canonicalVaultPath,
  type ObsidianAgentsConfig,
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
import { formatObsidianAgentsStatus } from './obsidian-status';

const commonArgs = {
  ...cliContractArgs,
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
        if (args.profile !== undefined)
          throw createCliError(
            'invalid_option',
            '--profile has been removed. Select a vault with --vault <path>.',
          );
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
  const interactive = scope.context.interactive && !scope.context.json;
  const input = await collectSetupInput(args, config, interactive);
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
      `vault: ${plan.vault.vaultPath}`,
    );
    writeHumanStatus(
      scope.context,
      processOutput,
      `source: ${plan.vault.sourcePath}`,
    );
    writeHumanStatus(
      scope.context,
      processOutput,
      `.agents: ${plan.vault.agentsPath}`,
    );
    writeHumanStatus(scope.context, processOutput, 'scope: vault-local');
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
    vaultPath: getStringArg(args.vault),
  });
  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: 'obsidian agents status',
      result,
    });
  } else {
    const color =
      process.stdout.isTTY === true &&
      process.env.NO_COLOR === undefined &&
      pc.isColorSupported;
    for (const line of formatObsidianAgentsStatus(result, {
      columns: process.stdout.columns,
      color,
    })) {
      writeHumanStatus(scope.context, processOutput, line);
    }
  }
  process.exitCode = 0;
}

async function collectSetupInput(
  args: ObsidianArgs,
  config: ObsidianAgentsConfig | undefined,
  interactive: boolean,
): Promise<ObsidianAgentsSetupInput | undefined> {
  const suppliedVault = getStringArg(args.vault);
  const suppliedSource = getStringArg(args.sourcePath);
  if (!interactive && !suppliedVault) {
    throw createCliError(
      'missing_required_argument',
      'Setup requires --vault in non-interactive mode.',
    );
  }
  const chosenVault =
    suppliedVault ??
    (await promptString('Obsidian vault path', undefined, (value) =>
      value.trim() ? undefined : 'A vault path is required.',
    ));
  if (!chosenVault) return undefined;
  const vaultPath = await canonicalVaultPath(chosenVault);
  const current = config
    ? selectObsidianAgentsProfile(config, vaultPath)
    : undefined;
  if (current && interactive && !suppliedSource) {
    writeHumanStatus(
      {
        json: false,
        quiet: args.quiet === true,
        isTty: true,
        interactive: true,
      },
      processOutput,
      `Vault: ${current.vaultPath}\nSource: ${current.sourcePath}\nLink: ${current.agentsPath}`,
    );
    const choice = await select<'keep' | 'edit'>({
      message: 'This vault is already configured.',
      options: [
        { value: 'keep', label: 'Keep current configuration' },
        { value: 'edit', label: 'Change visible source' },
      ],
      initialValue: 'keep',
    });
    if (isCancel(choice)) return undefined;
    if (choice === 'keep') return current;
  }
  const sourcePath =
    suppliedSource ??
    (interactive
      ? await promptString(
          'Visible Agents source path',
          current?.sourcePath ?? join(vaultPath, 'Agents'),
          (value) => (value.trim() ? undefined : 'A source path is required.'),
        )
      : (current?.sourcePath ?? join(vaultPath, 'Agents')));
  if (!sourcePath) return undefined;
  return canonicalizeObsidianAgentsProfile({
    vaultPath: chosenVault,
    sourcePath,
  });
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
  const profile = result.vault as ObsidianAgentsProfile | undefined;
  if (profile) {
    writeHumanStatus(context, processOutput, `source: ${profile.sourcePath}`);
    writeHumanStatus(context, processOutput, `.agents: ${profile.agentsPath}`);
  }
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
