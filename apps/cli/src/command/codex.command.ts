import { confirm, isCancel } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  applyCodexConfig,
  type CodexConfigComparison,
  compareCodexConfig,
  exportCodexConfig,
  installCodexAssets,
} from '../domain/codex-config-manager';
import type { CodexConfigPaths } from '../infra/codex-config-paths';
import { createCodexConfigPaths } from '../infra/codex-config-paths';
import { cliContractArgs, createCliContext } from '../runtime/cli-context';
import { createCliError } from '../runtime/cli-error';
import {
  processOutput,
  writeCommandError,
  writeHumanStatus,
  writeJsonValue,
} from '../runtime/output';

const configArgs = {
  ...cliContractArgs,
  repoRoot: {
    type: 'string',
    description: 'Override the repository root',
  },
  home: {
    type: 'string',
    description: 'Override the home directory',
  },
  codexHome: {
    type: 'string',
    description: 'Override the local Codex home directory',
  },
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

const applyArgs = {
  ...configArgs,
  yes: {
    type: 'boolean',
    description: 'Confirm overwriting local Codex prompts and rules',
  },
} as const;

type ConfigCommandArgs = {
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
  readonly repoRoot?: unknown;
  readonly home?: unknown;
  readonly codexHome?: unknown;
  readonly marketplace?: unknown;
  readonly pluginsRoot?: unknown;
  readonly cacheRoot?: unknown;
  readonly yes?: unknown;
};

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function createPaths(args: ConfigCommandArgs) {
  return createCodexConfigPaths({
    repoRoot: getStringArg(args.repoRoot),
    homeRoot: getStringArg(args.home),
    codexHome: getStringArg(args.codexHome),
    marketplace: getStringArg(args.marketplace),
    pluginsRoot: getStringArg(args.pluginsRoot),
    cacheRoot: getStringArg(args.cacheRoot),
  });
}

function writeDetailedStatusHuman(
  comparison: CodexConfigComparison,
  paths: CodexConfigPaths,
  args: ConfigCommandArgs,
): void {
  const context = createCliContext(args);
  writeHumanStatus(
    context,
    processOutput,
    pc.bold(pc.cyan('Codex Status Details')),
  );
  writeHumanStatus(context, processOutput, `local: ${paths.localCodexRoot}`);
  writeHumanStatus(context, processOutput, `repo:  ${paths.repoCodexRoot}`);
  writeHumanStatus(context, processOutput);
  writeHumanStatus(
    context,
    processOutput,
    pc.bold('Area      Added  Removed  Modified  Unchanged'),
  );
  for (const area of ['prompts', 'rules'] as const) {
    const counts = comparison.areas[area].counts;
    writeHumanStatus(
      context,
      processOutput,
      `${area.padEnd(9)} ${formatCount(counts.added, '+')} ${formatCount(
        counts.removed,
        '-',
      )} ${formatCount(counts.modified, '~')} ${formatCount(
        counts.unchanged,
        '=',
      )}`,
    );
  }

  for (const area of ['prompts', 'rules'] as const) {
    writeAreaDiff(context, area, comparison.areas[area].files);
  }

  writeIntentSection(context, 'Repository-owned assets not installed locally', [
    ['skills', comparison.missingRepoSkills],
    ['plugins', comparison.missingRepoPlugins],
  ]);
  writeRepoPluginStatusSection(context, comparison.repoPlugins);
  writeIntentSection(context, 'Local backup intent not tracked', [
    ['skills', comparison.unmanagedSkills],
    ['plugins', comparison.unmanagedPlugins],
  ]);
  writeIntentSection(context, 'Unsupported restore intent', [
    ['skills', comparison.unsupportedSkills],
    ['plugins', comparison.unsupportedPlugins],
  ]);
  writeIntentSection(context, 'Unsafe repository content', [
    ['paths', comparison.unsafeRepoPaths],
  ]);

  const next = chooseNextHint(comparison);
  if (next) {
    writeHumanStatus(context, processOutput);
    writeHumanStatus(context, processOutput, pc.bold('Next'));
    writeHumanStatus(context, processOutput, next);
  }
}

async function runComparison(
  args: ConfigCommandArgs,
) {
  const paths = createPaths(args);
  const comparison = await compareCodexConfig(paths);
  const ok = comparison.unsafeRepoPaths.length === 0;
  if (args.json === true) {
    writeJsonValue(processOutput, {
      ok,
      command: 'codex status',
      comparison,
    });
  } else {
    writeDetailedStatusHuman(comparison, paths, args);
  }
  process.exitCode = ok ? 0 : 1;
}

const maxDiffPathsPerState = 5;

function formatCount(count: number, state: '+' | '-' | '~' | '='): string {
  const value = `${state}${count}`.padStart(7);
  if (count === 0) {
    return pc.dim(value);
  }
  if (state === '+') {
    return pc.green(value);
  }
  if (state === '-') {
    return pc.red(value);
  }
  if (state === '~') {
    return pc.yellow(value);
  }
  return pc.dim(value);
}

function writeAreaDiff(
  context: ReturnType<typeof createCliContext>,
  area: 'prompts' | 'rules',
  files: CodexConfigComparison['areas']['prompts']['files'],
): void {
  const rows: Array<
    readonly [
      string,
      'added' | 'removed' | 'modified',
      (value: string) => string,
    ]
  > = [
    ['+', 'added', pc.green],
    ['-', 'removed', pc.red],
    ['~', 'modified', pc.yellow],
  ];
  const hasChanges = rows.some(([, state]) => files[state].length > 0);
  if (!hasChanges) {
    return;
  }

  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, pc.bold(area));
  for (const [prefix, state, color] of rows) {
    const paths = files[state];
    if (paths.length === 0) {
      continue;
    }

    for (const path of paths.slice(0, maxDiffPathsPerState)) {
      writeHumanStatus(context, processOutput, color(`${prefix} ${path}`));
    }
    const omitted = paths.length - maxDiffPathsPerState;
    if (omitted > 0) {
      writeHumanStatus(
        context,
        processOutput,
        pc.dim(`... ${omitted} more ${state} paths`),
      );
    }
  }
}

function writeIntentSection(
  context: ReturnType<typeof createCliContext>,
  title: string,
  rows: ReadonlyArray<readonly [string, readonly string[]]>,
): void {
  const visible = rows.filter(([, values]) => values.length > 0);
  if (visible.length === 0) {
    return;
  }

  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, pc.bold(title));
  for (const [label, values] of visible) {
    writeHumanStatus(context, processOutput, `${label}: ${values.join(', ')}`);
  }
}

function writeRepoPluginStatusSection(
  context: ReturnType<typeof createCliContext>,
  plugins: CodexConfigComparison['repoPlugins'],
): void {
  if (plugins.length === 0) {
    return;
  }

  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, pc.bold('Repository plugins'));
  for (const plugin of plugins) {
    writeHumanStatus(
      context,
      processOutput,
      `${plugin.name}: ${formatRepoPluginStatus(plugin.status)}`,
    );
  }
}

function formatRepoPluginStatus(
  status: CodexConfigComparison['repoPlugins'][number]['status'],
): string {
  if (status === 'applied') {
    return pc.green('applied');
  }
  if (status === 'not_applied') {
    return pc.yellow('not applied');
  }
  return pc.dim('disabled');
}

function chooseNextHint(comparison: CodexConfigComparison): string | undefined {
  if (
    comparison.missingRepoSkills.length > 0 ||
    comparison.missingRepoPlugins.length > 0
  ) {
    return 'Next: run `chc codex install` to install repository-owned assets locally.';
  }

  const hasLocalOnlyChanges = (['prompts', 'rules'] as const).some((area) => {
    const files = comparison.areas[area].files;
    return files.added.length > 0 || files.modified.length > 0;
  });
  if (
    hasLocalOnlyChanges ||
    comparison.unmanagedSkills.length > 0 ||
    comparison.unmanagedPlugins.length > 0
  ) {
    return 'Next: run `chc codex export` after reviewing local changes.';
  }

  if (
    comparison.unsupportedSkills.length > 0 ||
    comparison.unsupportedPlugins.length > 0
  ) {
    return 'Next: edit manifests or install unsupported entries manually.';
  }

  if (comparison.unsafeRepoPaths.length > 0) {
    return 'Next: remove unsafe runtime state from repository codex/.';
  }

  return undefined;
}

function writeManualInstallHint(
  context: ReturnType<typeof createCliContext>,
  result: {
    readonly unsupportedSkills: readonly string[];
    readonly unsupportedPlugins: readonly string[];
  },
): void {
  if (
    result.unsupportedSkills.length === 0 &&
    result.unsupportedPlugins.length === 0
  ) {
    return;
  }

  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, pc.bold('Manual install needed'));
  if (result.unsupportedSkills.length > 0) {
    writeHumanStatus(
      context,
      processOutput,
      `skills: ${result.unsupportedSkills.join(', ')}`,
    );
  }
  if (result.unsupportedPlugins.length > 0) {
    writeHumanStatus(
      context,
      processOutput,
      `plugins: ${result.unsupportedPlugins.join(', ')}`,
    );
  }
}

type ManagedApplyArea = 'prompts' | 'rules';

function getApplyOverwritePaths(
  comparison: CodexConfigComparison,
): Record<ManagedApplyArea, string[]> {
  return {
    prompts: [
      ...comparison.areas.prompts.files.added,
      ...comparison.areas.prompts.files.modified,
    ].sort(),
    rules: [
      ...comparison.areas.rules.files.added,
      ...comparison.areas.rules.files.modified,
    ].sort(),
  };
}

function hasApplyOverwriteRisk(
  paths: Record<ManagedApplyArea, readonly string[]>,
): boolean {
  return paths.prompts.length > 0 || paths.rules.length > 0;
}

async function confirmApplyOverwrite(
  context: ReturnType<typeof createCliContext>,
  paths: Record<ManagedApplyArea, string[]>,
  args: ConfigCommandArgs,
): Promise<boolean> {
  if (!hasApplyOverwriteRisk(paths) || args.yes === true) {
    return true;
  }

  const error = createCliError(
    'invalid_option',
    'codex apply would overwrite or delete local prompts/rules; rerun with --yes to confirm.',
  );
  if (context.json || !context.interactive) {
    writeCommandError(context, processOutput, error);
    process.exitCode = error.exitCode;
    return false;
  }

  writeHumanStatus(context, processOutput, pc.yellow(error.message));
  for (const area of ['prompts', 'rules'] as const) {
    if (paths[area].length === 0) {
      continue;
    }

    writeHumanStatus(context, processOutput, pc.bold(area));
    for (const path of paths[area].slice(0, maxDiffPathsPerState)) {
      writeHumanStatus(context, processOutput, pc.yellow(`! ${path}`));
    }
    const omitted = paths[area].length - maxDiffPathsPerState;
    if (omitted > 0) {
      writeHumanStatus(
        context,
        processOutput,
        pc.dim(`... ${omitted} more affected paths`),
      );
    }
  }

  const answer = await confirm({
    message: 'Overwrite local Codex prompts/rules from the repository?',
    initialValue: false,
  });
  if (isCancel(answer) || answer !== true) {
    const cancelError = createCliError('invalid_option', 'codex apply cancelled.');
    writeCommandError(context, processOutput, cancelError);
    process.exitCode = cancelError.exitCode;
    return false;
  }

  return true;
}

export const codexCommand = defineCommand({
  meta: {
    name: 'codex',
    description: 'Manage reproducible Codex configuration.',
  },
  subCommands: {
    status: defineCommand({
      meta: {
        name: 'status',
        description: 'Summarize local-versus-repository Codex config state.',
      },
      args: configArgs,
      async run({ args }) {
        await runComparison(args);
      },
    }),
    export: defineCommand({
      meta: {
        name: 'export',
        description: 'Export safe local Codex config into the repository.',
      },
      args: configArgs,
      async run({ args }) {
        const context = createCliContext(args);
        const result = await exportCodexConfig(createPaths(args));
        if (context.json) {
          writeJsonValue(processOutput, {
            ok: true,
            command: 'codex export',
            result,
          });
        } else {
          writeHumanStatus(context, processOutput, pc.cyan('Codex export'));
          writeHumanStatus(
            context,
            processOutput,
            `exported: ${result.exportedAreas.join(', ')}`,
          );
        }
        process.exitCode = 0;
      },
    }),
    apply: defineCommand({
      meta: {
        name: 'apply',
        description: 'Restore repository Codex config locally.',
      },
      args: applyArgs,
      async run({ args }) {
        const context = createCliContext(args);
        const paths = createPaths(args);
        const comparison = await compareCodexConfig(paths);
        if (
          !(await confirmApplyOverwrite(
            context,
            getApplyOverwritePaths(comparison),
            args,
          ))
        ) {
          return;
        }

        const result = await applyCodexConfig(paths);
        if (context.json) {
          writeJsonValue(processOutput, {
            ok: true,
            command: 'codex apply',
            result,
          });
        } else {
          writeHumanStatus(context, processOutput, pc.cyan('Codex apply'));
          writeHumanStatus(
            context,
            processOutput,
            `applied: ${result.appliedAreas.join(', ')}`,
          );
          writeManualInstallHint(context, result);
        }
        process.exitCode = 0;
      },
    }),
    install: defineCommand({
      meta: {
        name: 'install',
        description: 'Install repository-owned Codex skills and plugins locally.',
      },
      args: configArgs,
      async run({ args }) {
        const context = createCliContext(args);
        const result = await installCodexAssets(createPaths(args));
        if (context.json) {
          writeJsonValue(processOutput, {
            ok: true,
            command: 'codex install',
            result,
          });
        } else {
          writeHumanStatus(context, processOutput, pc.cyan('Codex install'));
          writeHumanStatus(
            context,
            processOutput,
            `installed skills: ${result.installedSkills.join(', ') || '(none)'}`,
          );
          writeHumanStatus(
            context,
            processOutput,
            `installed plugins: ${
              result.installedPlugins.map((plugin) => plugin.name).join(', ') ||
              '(none)'
            }`,
          );
          writeManualInstallHint(context, result);
        }
        process.exitCode = 0;
      },
    }),
  },
});
