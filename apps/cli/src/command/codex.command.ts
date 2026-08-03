import { emitKeypressEvents } from 'node:readline';
import {
  confirm,
  isCancel,
  multiselect,
  text as promptText,
  select,
} from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import { installRepositoryCodexPlugins } from '../domain/codex-plugin-install-manager';
import {
  createNpxSkillsBackend,
  type DiscoveredSkill,
  type LocalGitHubSkillCandidate,
  type SkillsBackend,
} from '../domain/codex-skills-backend';
import {
  buildManagedSkillInventory,
  executeSkillPlan,
  type ManagedSkillAction,
  type ManagedSkillInventoryRow,
  type SkillPlanItem,
} from '../domain/codex-skills-manager';
import {
  type CodexSkillsManifest,
  type ManagedCodexSkill,
  readCodexSkillsManifest,
} from '../domain/codex-skills-manifest';
import { createCodexConfigPaths } from '../infra/codex-config-paths';
import { cliContractArgs } from '../runtime/cli-context';
import { createCliError } from '../runtime/cli-error';
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
  repoRoot: { type: 'string', description: 'Override the repository root' },
  home: { type: 'string', description: 'Override the home directory' },
  codexHome: {
    type: 'string',
    description: 'Override the local Codex home directory',
  },
} as const;

const installArgs = {
  ...commonArgs,
  marketplace: {
    type: 'string',
    description: 'Override the personal marketplace.json path',
  },
  pluginsRoot: {
    type: 'string',
    description: 'Override the repository-managed codex/plugins directory',
  },
  cacheRoot: {
    type: 'string',
    description: 'Override the Codex personal plugin cache directory',
  },
} as const;

type CodexArgs = {
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
  readonly repoRoot?: unknown;
  readonly home?: unknown;
  readonly codexHome?: unknown;
  readonly marketplace?: unknown;
  readonly pluginsRoot?: unknown;
  readonly cacheRoot?: unknown;
};

export type SkillsInteraction = {
  readonly chooseMode: () => Promise<'manage' | 'add' | undefined>;
  readonly chooseManagedActions: (
    rows: readonly ManagedSkillInventoryRow[],
  ) => Promise<
    | ReadonlyArray<{
        readonly name: string;
        readonly action: Exclude<ManagedSkillAction, 'none'>;
      }>
    | undefined
  >;
  readonly requestRepository: () => Promise<string | undefined>;
  readonly chooseDiscoveredNames: (
    skills: readonly DiscoveredSkill[],
  ) => Promise<readonly string[] | undefined>;
  readonly chooseTrackingType: (
    candidate?: LocalGitHubSkillCandidate,
  ) => Promise<'branch' | 'pin' | undefined>;
  readonly requestTrackingRef: (
    type: 'branch' | 'pin',
    initialValue?: string,
  ) => Promise<string | undefined>;
  readonly confirmPlan: (
    plan: readonly SkillPlanItem[],
  ) => Promise<boolean | undefined>;
};

export type RunSkillsDependencies = {
  readonly createBackend?: (
    paths: ReturnType<typeof createPaths>,
  ) => SkillsBackend;
  readonly interaction?: SkillsInteraction;
};

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function createPaths(args: CodexArgs) {
  return createCodexConfigPaths({
    repoRoot: getStringArg(args.repoRoot),
    homeRoot: getStringArg(args.home),
    codexHome: getStringArg(args.codexHome),
    marketplace: getStringArg(args.marketplace),
    pluginsRoot: getStringArg(args.pluginsRoot),
    cacheRoot: getStringArg(args.cacheRoot),
  });
}

async function runObservedCodexSubcommand(
  subcommand: string,
  args: CodexArgs,
  run: (scope: ObservedCliCommandScope) => Promise<void> | void,
): Promise<void> {
  await runObservedCliCommand(args, { command: 'codex', subcommand }, run);
}

function failCommand(scope: ObservedCliCommandScope, message: string): void {
  const error = createCliError('invalid_option', message);
  scope.fail(error);
  writeCommandError(scope.context, processOutput, error);
  process.exitCode = error.exitCode;
}

export async function runSkills(
  args: CodexArgs,
  scope: ObservedCliCommandScope,
  dependencies: RunSkillsDependencies = {},
): Promise<void> {
  if (!scope.context.json && !scope.context.interactive) {
    failCommand(
      scope,
      '`chc codex skills` requires an interactive terminal; use --json for a read-only snapshot.',
    );
    return;
  }

  const paths = createPaths(args);
  const manifestResult = await readCodexSkillsManifest(paths.repoCodexRoot);
  const backend = dependencies.createBackend
    ? dependencies.createBackend(paths)
    : createNpxSkillsBackend({
        homeRoot: paths.homeRoot,
        localCodexRoot: paths.localCodexRoot,
      });
  const inventory = await buildManagedSkillInventory({
    ...manifestResult,
    backend,
  });

  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: 'codex skills',
      result: {
        manifestVersion: manifestResult.manifest.version,
        skills: inventory,
        legacyEntries: manifestResult.legacyEntries,
      },
    });
    process.exitCode = 0;
    return;
  }

  if (manifestResult.legacyEntries.length > 0) {
    failCommand(
      scope,
      `The version 1 skills manifest contains entries without reinstallable sources (${manifestResult.legacyEntries.join(', ')}). Migrate it explicitly to version 2 before making changes.`,
    );
    return;
  }

  writeInventory(scope, inventory);
  const interaction = dependencies.interaction ?? defaultSkillsInteraction;
  const mode = await interaction.chooseMode();
  if (!mode) {
    return;
  }
  if (mode === 'manage' && inventory.length === 0) {
    writeHumanStatus(
      scope.context,
      processOutput,
      pc.dim('No tracked or trackable GitHub skills were found.'),
    );
    writeHumanStatus(
      scope.context,
      processOutput,
      pc.dim('Choose Add skills from GitHub to install and track one.'),
    );
    return;
  }

  const plan =
    mode === 'add'
      ? await createAddPlan(manifestResult.manifest, backend, interaction)
      : await createManagePlan(inventory, backend, interaction);
  if (!plan) {
    writeHumanStatus(scope.context, processOutput, pc.dim('Cancelled.'));
    return;
  }
  if (plan.length === 0) {
    writeHumanStatus(
      scope.context,
      processOutput,
      pc.dim('No changes selected.'),
    );
    return;
  }

  writePlan(scope, plan);
  const approved = await interaction.confirmPlan(plan);
  if (approved !== true) {
    writeHumanStatus(scope.context, processOutput, pc.dim('Cancelled.'));
    return;
  }

  const result = await executeSkillPlan({
    repoCodexRoot: paths.repoCodexRoot,
    manifest: manifestResult.manifest,
    items: plan,
    backend,
  });
  for (const item of result.completed) {
    writeHumanStatus(
      scope.context,
      processOutput,
      pc.green(`done  ${item.action} ${item.name}`),
    );
  }
  for (const failure of result.failed) {
    writeHumanStatus(
      scope.context,
      processOutput,
      pc.red(
        `failed ${failure.item.action} ${failure.item.name}: ${failure.error}`,
      ),
    );
  }
  process.exitCode = result.failed.length === 0 ? 0 : 1;
}

function writeInventory(
  scope: ObservedCliCommandScope,
  inventory: readonly ManagedSkillInventoryRow[],
): void {
  writeHumanStatus(
    scope.context,
    processOutput,
    pc.bold('Codex skills reconciliation'),
  );
  if (inventory.length === 0) {
    writeHumanStatus(scope.context, processOutput, pc.dim('(none)'));
    return;
  }
  for (const row of inventory) {
    writeHumanStatus(
      scope.context,
      processOutput,
      `${row.name.padEnd(28)} ${row.state.padEnd(20)} ${pc.dim(row.source)}`,
    );
  }
}

async function createManagePlan(
  inventory: readonly ManagedSkillInventoryRow[],
  backend: SkillsBackend,
  interaction: SkillsInteraction,
): Promise<SkillPlanItem[] | undefined> {
  const actionable = inventory.filter((row) =>
    row.availableActions.some((action) => action !== 'none'),
  );
  if (actionable.length === 0) {
    return [];
  }
  const choices = await interaction.chooseManagedActions(actionable);
  if (!choices) {
    return undefined;
  }

  const plan: SkillPlanItem[] = [];
  for (const choice of choices) {
    const row = actionable.find((candidate) => candidate.name === choice.name);
    if (!row) {
      continue;
    }
    if (choice.action === 'track') {
      const candidate = row.localGitHubCandidate;
      if (!candidate) {
        throw new Error(`Missing local GitHub provenance for ${row.name}.`);
      }
      const trackingType = await interaction.chooseTrackingType(candidate);
      if (!trackingType) {
        return undefined;
      }
      const ref = await interaction.requestTrackingRef(
        trackingType,
        candidate.ref,
      );
      if (!ref) {
        return undefined;
      }
      const skill: ManagedCodexSkill = {
        name: row.name,
        source: 'github',
        repository: candidate.repository,
        selector: candidate.selector,
        tracking: { type: trackingType, ref: ref.trim() },
        enabled: true,
      };
      await backend.validate(skill);
      plan.push({
        action: 'track',
        name: row.name,
        skill,
        installedPath: row.installedPath,
        installedManaged: true,
      });
    } else {
      plan.push({
        action: choice.action,
        name: row.name,
        skill: row.skill,
        installedPath: row.installedPath,
        installedManaged: row.installedManaged,
      });
    }
  }
  return plan;
}

async function createAddPlan(
  manifest: CodexSkillsManifest,
  backend: SkillsBackend,
  interaction: SkillsInteraction,
): Promise<SkillPlanItem[] | undefined> {
  const repositoryAnswer = await interaction.requestRepository();
  if (!repositoryAnswer) {
    return undefined;
  }
  const repository = repositoryAnswer.trim();
  const discovered = await backend.discover(repository);
  const selectedNames = await interaction.chooseDiscoveredNames(discovered);
  if (!selectedNames) {
    return undefined;
  }
  const trackingType = await interaction.chooseTrackingType();
  if (!trackingType) {
    return undefined;
  }
  const refAnswer = await interaction.requestTrackingRef(trackingType);
  if (!refAnswer) {
    return undefined;
  }

  const selectedSkills: ManagedCodexSkill[] = selectedNames.map((name) => ({
    name,
    source: 'github',
    repository,
    selector: name,
    tracking: { type: trackingType, ref: refAnswer.trim() },
    enabled: true,
  }));
  const candidateManifest: CodexSkillsManifest = {
    version: 2,
    skills: [
      ...manifest.skills.filter(
        (existing) => !selectedNames.includes(existing.name),
      ),
      ...selectedSkills,
    ],
  };
  const inventory = await buildManagedSkillInventory({
    manifest: candidateManifest,
    legacyEntries: [],
    backend,
  });
  return selectedSkills.map((skill) => {
    const row = inventory.find((candidate) => candidate.name === skill.name);
    if (row?.state === 'unmanaged_collision') {
      return {
        action: 'replace' as const,
        name: skill.name,
        skill,
        installedPath: row.installedPath,
      };
    }
    if (row?.state === 'missing') {
      return { action: 'add' as const, name: skill.name, skill };
    }
    return { action: 'enable' as const, name: skill.name, skill };
  });
}

const defaultSkillsInteraction: SkillsInteraction = {
  async chooseMode() {
    const answer = await select<'manage' | 'add'>({
      message: 'Codex skills',
      options: [
        { value: 'manage', label: 'Manage tracked and local skills' },
        { value: 'add', label: 'Add skills from GitHub' },
      ],
    });
    return isCancel(answer) ? undefined : answer;
  },
  async chooseManagedActions(rows) {
    return promptManagedActionTable(rows);
  },
  async requestRepository() {
    const answer = await promptText({
      message: 'GitHub repository (owner/repo)',
      validate(value) {
        return /^[^/\s]+\/[^/\s]+$/u.test(value.trim())
          ? undefined
          : 'Use owner/repo format.';
      },
    });
    return isCancel(answer) ? undefined : answer.trim();
  },
  async chooseDiscoveredNames(skills) {
    const answer = await multiselect<string>({
      message: 'Select skills to track (Space toggles)',
      required: true,
      options: skills.map((skill) => ({
        value: skill.name,
        label: skill.name,
      })),
    });
    return isCancel(answer) ? undefined : answer;
  },
  async chooseTrackingType() {
    const answer = await select<'branch' | 'pin'>({
      message: 'Tracking mode',
      options: [
        { value: 'branch', label: 'Track a branch' },
        { value: 'pin', label: 'Pin a commit or tag' },
      ],
    });
    return isCancel(answer) ? undefined : answer;
  },
  async requestTrackingRef(type, initialValue) {
    const answer = await promptText({
      message: type === 'branch' ? 'Branch' : 'Commit or tag',
      initialValue: initialValue ?? (type === 'branch' ? 'main' : undefined),
      validate: (value) =>
        value.trim().length > 0 ? undefined : 'A ref is required.',
    });
    return isCancel(answer) ? undefined : answer.trim();
  },
  async confirmPlan() {
    const answer = await confirm({
      message: 'Apply this skills plan?',
      initialValue: false,
    });
    return isCancel(answer) ? undefined : answer;
  },
};

async function promptManagedActionTable(
  rows: readonly ManagedSkillInventoryRow[],
): Promise<
  | ReadonlyArray<{
      readonly name: string;
      readonly action: Exclude<ManagedSkillAction, 'none'>;
    }>
  | undefined
> {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    return undefined;
  }
  const indexes = rows.map(() => 0);
  let focused = 0;
  let renderedLines = 0;
  const control = String.fromCharCode(27);

  function render(): void {
    const lines = [
      pc.bold('Choose skill actions'),
      pc.dim('↑/↓ move · Space cycles valid actions · Enter reviews plan'),
      ...rows.map((row, index) => {
        const action = row.availableActions[indexes[index] ?? 0] ?? 'none';
        const marker = index === focused ? pc.cyan('›') : ' ';
        const actionLabel =
          action === 'none' ? pc.dim('none') : pc.yellow(action);
        return `${marker} ${row.name.padEnd(26)} ${row.state.padEnd(20)} ${actionLabel.padEnd(18)} ${pc.dim(row.source)}`;
      }),
    ];
    if (renderedLines > 0) {
      process.stdout.write(`${control}[${renderedLines}A${control}[0J`);
    }
    process.stdout.write(`${lines.join('\n')}\n`);
    renderedLines = lines.length;
  }

  return await new Promise((resolve) => {
    const wasRaw = input.isRaw;
    const finish = (cancelled: boolean) => {
      input.off('keypress', onKeypress);
      input.setRawMode(wasRaw);
      if (!wasRaw) {
        input.pause();
      }
      process.stdout.write(`${control}[?25h`);
      if (cancelled) {
        resolve(undefined);
        return;
      }
      resolve(
        rows.flatMap((row, index) => {
          const action = row.availableActions[indexes[index] ?? 0] ?? 'none';
          return action === 'none' ? [] : [{ name: row.name, action }];
        }),
      );
    };
    const onKeypress = (
      _value: string,
      key: { readonly name?: string; readonly ctrl?: boolean },
    ) => {
      if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
        finish(true);
        return;
      }
      if (key.name === 'up') {
        focused = (focused - 1 + rows.length) % rows.length;
      } else if (key.name === 'down') {
        focused = (focused + 1) % rows.length;
      } else if (key.name === 'space') {
        indexes[focused] =
          ((indexes[focused] ?? 0) + 1) % rows[focused].availableActions.length;
      } else if (key.name === 'return' || key.name === 'enter') {
        finish(false);
        return;
      } else {
        return;
      }
      render();
    };

    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    input.on('keypress', onKeypress);
    process.stdout.write(`${control}[?25l`);
    render();
  });
}

function writePlan(
  scope: ObservedCliCommandScope,
  plan: readonly SkillPlanItem[],
): void {
  writeHumanStatus(scope.context, processOutput);
  writeHumanStatus(scope.context, processOutput, pc.bold('Plan'));
  for (const item of plan) {
    writeHumanStatus(
      scope.context,
      processOutput,
      `${item.action.padEnd(8)} ${item.name} ${pc.dim(describePlanEffect(item))}`,
    );
  }
}

function describePlanEffect(item: SkillPlanItem): string {
  if (item.action === 'track' && item.skill) {
    return `(manifest only; ${item.skill.repository}:${item.skill.selector}@${item.skill.tracking.ref} ${item.skill.tracking.type}; keep local installation unchanged)`;
  }
  if (item.action === 'add' || item.action === 'install') {
    return '(install locally; add/retain manifest entry)';
  }
  if (item.action === 'replace') {
    return '(snapshot collision; install locally; add/retain manifest entry)';
  }
  if (item.action === 'remove') {
    return item.installedManaged
      ? '(remove managed installation; remove manifest entry)'
      : '(leave unmanaged local copy; remove manifest entry)';
  }
  if (item.action === 'enable') {
    return '(enable manifest entry)';
  }
  if (item.action === 'update') {
    return '(update local installation; preserve manifest source)';
  }
  return '';
}

export const codexCommand = defineCommand({
  meta: {
    name: 'codex',
    description: 'Manage Codex skills and repository plugins.',
  },
  subCommands: {
    skills: defineCommand({
      meta: {
        name: 'skills',
        description:
          'Reconcile manifest-tracked and eligible local GitHub skills.',
      },
      args: commonArgs,
      async run({ args }) {
        await runObservedCodexSubcommand('skills', args, async (scope) => {
          await runSkills(args, scope);
        });
      },
    }),
    install: defineCommand({
      meta: {
        name: 'install',
        description: 'Install repository-owned Codex plugins locally.',
      },
      args: installArgs,
      async run({ args }) {
        await runObservedCodexSubcommand(
          'install',
          args,
          async ({ context }) => {
            const result = await installRepositoryCodexPlugins(
              createPaths(args),
            );
            if (context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: 'codex install',
                result,
              });
            } else {
              writeHumanStatus(
                context,
                processOutput,
                pc.cyan('Codex install'),
              );
              writeHumanStatus(
                context,
                processOutput,
                `installed plugins: ${result.installedPlugins.map((plugin) => plugin.name).join(', ') || '(none)'}`,
              );
            }
            process.exitCode = 0;
          },
        );
      },
    }),
  },
});
