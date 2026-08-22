import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { confirm, isCancel, text as promptText, select } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  ObsidianAgentsConfigError,
  readObsidianAgentsConfig,
  selectObsidianAgentsProfile,
} from '../domain/obsidian-agents-config';
import {
  ObsidianAgentsGitError,
  readGitSnapshot,
} from '../domain/obsidian-agents-git';
import { ObsidianAgentsLockError } from '../domain/obsidian-agents-lock';
import {
  applyObsidianAgentsSetup,
  createObsidianAgentsSetupPlan,
  getObsidianAgentsProfile,
  inspectObsidianAgentsHookReadiness,
  inspectObsidianAgentsStatus,
  ObsidianAgentsServiceError,
  type ObsidianAgentsSetupInput,
  type ObsidianAgentsStatus,
  synchronizeObsidianAgents,
} from '../domain/obsidian-agents-service';
import { createCodexConfigPaths } from '../infra/codex-config-paths';
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
  agentsPath: {
    type: 'string',
    description: 'Override the vault .agents path',
  },
  remote: {
    type: 'string',
    description: 'Private Git remote URL',
  },
  branch: {
    type: 'string',
    description: 'Git branch to initialize or publish',
  },
  dataRoot: {
    type: 'string',
    description: 'Override the local CthuTool chc data directory',
  },
  repoRoot: {
    type: 'string',
    description: 'Override the CthuTool repository root for Hook status',
  },
  home: {
    type: 'string',
    description: 'Override the user home directory',
  },
  codexHome: {
    type: 'string',
    description: 'Override the local Codex home directory',
  },
  cacheRoot: {
    type: 'string',
    description: 'Override the local Codex plugin cache directory',
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
  readonly agentsPath?: unknown;
  readonly remote?: unknown;
  readonly branch?: unknown;
  readonly dataRoot?: unknown;
  readonly repoRoot?: unknown;
  readonly home?: unknown;
  readonly codexHome?: unknown;
  readonly cacheRoot?: unknown;
  readonly yes?: unknown;
  readonly refresh?: unknown;
  readonly phase?: unknown;
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

function createCodexPaths(args: ObsidianArgs) {
  return createCodexConfigPaths({
    repoRoot: getStringArg(args.repoRoot),
    homeRoot: getStringArg(args.home),
    codexHome: getStringArg(args.codexHome),
    cacheRoot: getStringArg(args.cacheRoot),
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
  const currentGit =
    current && (await isDirectory(current.agentsPath))
      ? await readGitSnapshot(current.agentsPath)
      : undefined;
  const interactive = scope.context.interactive && !scope.context.json;
  const input = await collectSetupInput(args, current, currentGit, interactive);
  if (!input) {
    const result = { status: 'cancelled' };
    writeSetupResult(scope.context, result);
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
      `agents: ${plan.profile.agentsPath}`,
    );
    for (const action of plan.actions) {
      writeHumanStatus(scope.context, processOutput, `- ${action}`);
    }
    if (plan.initialFiles.length > 0) {
      writeHumanStatus(scope.context, processOutput, 'initial files:');
      for (const file of plan.initialFiles) {
        writeHumanStatus(scope.context, processOutput, `  ${file}`);
      }
    }
  }

  const requiresConfirmation = plan.actions.some(
    (action) => !action.startsWith('validate'),
  );
  if (requiresConfirmation && args.yes !== true) {
    if (!interactive) {
      throw createCliError(
        'invalid_option',
        'Setup would mutate the agents repository. Use --yes in non-interactive mode.',
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
  const paths = createDataPaths(args);
  const codexPaths = createCodexPaths(args);
  const hook = await inspectObsidianAgentsHookReadiness({
    sourcePath: join(
      codexPaths.repoCodexRoot,
      'plugins',
      'cthu-codex',
      'hooks',
      'hooks.json',
    ),
    cacheRoot: codexPaths.cacheRoot,
  });
  const result = await inspectObsidianAgentsStatus({
    paths,
    profileId: getStringArg(args.profile),
    refresh: args.refresh === true,
    hook,
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

async function runSync(
  args: ObsidianArgs,
  scope: ObservedCliCommandScope,
): Promise<void> {
  const phase = getStringArg(args.phase);
  if (phase !== 'before' && phase !== 'after') {
    throw createCliError(
      'invalid_option',
      'Sync phase must be either before or after.',
    );
  }
  const paths = createDataPaths(args);
  const profile = await getObsidianAgentsProfile(
    paths,
    getStringArg(args.profile),
  );
  const result = await synchronizeObsidianAgents({
    paths,
    profile,
    phase,
  });
  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: `obsidian agents sync ${phase}`,
      result,
    });
  } else {
    writeHumanStatus(
      scope.context,
      processOutput,
      pc.cyan(`Obsidian agents sync (${phase})`),
    );
    writeHumanStatus(
      scope.context,
      processOutput,
      result.changed
        ? `committed: ${result.commit?.slice(0, 7) ?? 'yes'}; pushed: ${result.pushed ? 'yes' : 'no'}`
        : 'no changes',
    );
  }
  process.exitCode = 0;
}

async function collectSetupInput(
  args: ObsidianArgs,
  current: ObsidianAgentsSetupInput | undefined,
  currentGit: Awaited<ReturnType<typeof readGitSnapshot>> | undefined,
  interactive: boolean,
): Promise<ObsidianAgentsSetupInput | undefined> {
  const suppliedProfile = getStringArg(args.profile);
  const suppliedVault = getStringArg(args.vault);
  const suppliedAgents = getStringArg(args.agentsPath);
  const suppliedRemote = getStringArg(args.remote);
  const suppliedBranch = getStringArg(args.branch);
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
      agentsPath: suppliedAgents ?? current?.agentsPath,
      remote: suppliedRemote ?? currentGit?.remote,
      branch: suppliedBranch ?? currentGit?.branch ?? 'main',
    };
  }

  let shouldEdit = current === undefined;
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
    shouldEdit = choice === 'edit';
    if (!shouldEdit && !suppliedVault && !suppliedAgents && !suppliedRemote) {
      return {
        ...current,
        remote: currentGit?.remote,
        branch: currentGit?.branch ?? suppliedBranch ?? 'main',
      };
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
  const agentsPath =
    suppliedAgents ??
    (await promptString(
      'Agents path',
      current?.agentsPath ?? join(vaultPath, '.agents'),
      (value) => (value.trim() ? undefined : 'An agents path is required.'),
    ));
  if (!agentsPath) return undefined;
  const remote =
    suppliedRemote ??
    (await promptString(
      'Private Git remote URL',
      currentGit?.remote,
      (value) =>
        value.trim() ? undefined : 'A private Git remote is required.',
    ));
  if (!remote) return undefined;
  const branch =
    suppliedBranch ??
    (await promptString('Git branch', currentGit?.branch ?? 'main', (value) =>
      value.trim() ? undefined : 'A branch is required.',
    ));
  if (!branch) return undefined;
  return { id, vaultPath, agentsPath, remote, branch };
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
  const profile = result.profile as { id?: string } | undefined;
  if (profile?.id)
    writeHumanStatus(context, processOutput, `profile: ${profile.id}`);
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
    `agents: ${check(result.paths.agentsExists)} ${result.profile?.agentsPath ?? ''}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `git: ${check(result.git.isRepository)} ${result.git.branch ?? 'not a repository'}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `remote: ${result.git.remote ?? 'missing'}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `worktree: ${result.git.worktreeChanges.length === 0 ? 'clean' : `${result.git.worktreeChanges.length} change(s)`}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `sync: ${result.sync.state}${result.sync.refreshed ? ' (refreshed)' : ''}`,
  );
  writeHumanStatus(
    context,
    processOutput,
    `hook: ${result.hook.ready ? 'ready' : 'not ready'}`,
  );
  if (result.sync.refreshError) {
    writeHumanStatus(
      context,
      processOutput,
      `refresh error: ${result.sync.refreshError}`,
    );
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
  if (error instanceof ObsidianAgentsLockError) {
    return createCliError('obsidian_agents_busy', error.message);
  }
  if (error instanceof ObsidianAgentsGitError) {
    return createCliError(
      error.kind === 'conflict' || error.kind === 'non_fast_forward'
        ? 'obsidian_agents_conflict'
        : 'obsidian_agents_sync_failed',
      error.message,
    );
  }
  if (error instanceof Error && 'code' in error && 'exitCode' in error) {
    return error as CliError;
  }
  return createCliError(
    'obsidian_agents_sync_failed',
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
    case 'sync_failed':
      return 'obsidian_agents_sync_failed';
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return false;
    }
    throw error;
  }
}

export const obsidianCommand = defineCommand({
  meta: {
    name: 'obsidian',
    description: 'Manage Obsidian Skill and state synchronization.',
  },
  subCommands: {
    agents: defineCommand({
      meta: {
        name: 'agents',
        description: 'Manage the Obsidian .agents Git repository.',
      },
      subCommands: {
        setup: defineCommand({
          meta: {
            name: 'setup',
            description: 'Interactively configure or edit Obsidian agents.',
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
            description: 'Show Obsidian agents configuration and sync status.',
          },
          args: {
            ...commonArgs,
            refresh: {
              type: 'boolean',
              description: 'Fetch remote metadata before reporting status',
            },
          },
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
        sync: defineCommand({
          meta: {
            name: 'sync',
            description: 'Run one safe before or after synchronization phase.',
          },
          args: {
            ...commonArgs,
            phase: {
              type: 'string',
              description: 'Synchronization phase: before or after',
            },
          },
          async run({ args }) {
            const typedArgs = args as unknown as ObsidianArgs;
            await runObservedObsidianSubcommand(
              'sync',
              typedArgs,
              async (scope) => {
                await runSync(typedArgs, scope);
              },
            );
          },
        }),
      },
    }),
  },
});
