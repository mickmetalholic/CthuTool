import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  applyCodexConfig,
  type CodexConfigComparison,
  compareCodexConfig,
  doctorCodexRepo,
  exportCodexConfig,
} from '../domain/codex-config-manager';
import { createCodexConfigPaths } from '../infra/codex-config-paths';
import { cliContractArgs, createCliContext } from '../runtime/cli-context';
import {
  processOutput,
  writeHumanStatus,
  writeJsonValue,
} from '../runtime/output';
import { createCodexPluginsCommand } from './codex-plugins.command';

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
    description: 'Override the repository Codex plugins directory',
  },
  cacheRoot: {
    type: 'string',
    description: 'Override the Codex personal plugin cache directory',
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

function writeComparisonHuman(
  command: string,
  comparison: CodexConfigComparison,
  args: ConfigCommandArgs,
): void {
  const context = createCliContext(args);
  writeHumanStatus(context, processOutput, pc.cyan(`Codex ${command}`));
  for (const area of ['prompts', 'rules'] as const) {
    const counts = comparison.areas[area].counts;
    writeHumanStatus(
      context,
      processOutput,
      `${area}: +${counts.added} -${counts.removed} ~${counts.modified} =${counts.unchanged}`,
    );
  }
  if (comparison.unmanagedSkills.length > 0) {
    writeHumanStatus(
      context,
      processOutput,
      `unmanaged skills: ${comparison.unmanagedSkills.join(', ')}`,
    );
  }
  if (comparison.unmanagedPlugins.length > 0) {
    writeHumanStatus(
      context,
      processOutput,
      `unmanaged plugins: ${comparison.unmanagedPlugins.join(', ')}`,
    );
  }
  if (comparison.configTomlReadOnly) {
    writeHumanStatus(
      context,
      processOutput,
      'config.toml: read-only unmanaged',
    );
  }
}

async function runComparison(
  command: 'status' | 'diff',
  args: ConfigCommandArgs,
) {
  const comparison = await compareCodexConfig(createPaths(args));
  if (args.json === true) {
    writeJsonValue(processOutput, {
      ok: true,
      command: `codex ${command}`,
      comparison,
    });
  } else {
    writeComparisonHuman(command, comparison, args);
  }
  process.exitCode = 0;
}

export const codexCommand = defineCommand({
  meta: {
    name: 'codex',
    description:
      'Manage reproducible Codex configuration and personal plugins.',
  },
  subCommands: {
    plugins: createCodexPluginsCommand(undefined, {
      metaName: 'plugins',
      jsonCommand: 'codex plugins',
      examples: [
        '  chc codex plugins',
        '  chc codex plugins --plugin english-coach',
        '  chc codex plugins --plugin english-coach --sync-cache',
      ],
    }),
    status: defineCommand({
      meta: {
        name: 'status',
        description: 'Summarize local-versus-repository Codex config state.',
      },
      args: configArgs,
      async run({ args }) {
        await runComparison('status', args);
      },
    }),
    diff: defineCommand({
      meta: {
        name: 'diff',
        description: 'Show a diff-oriented Codex config comparison.',
      },
      args: configArgs,
      async run({ args }) {
        await runComparison('diff', args);
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
        description: 'Apply repository-managed Codex config locally.',
      },
      args: configArgs,
      async run({ args }) {
        const context = createCliContext(args);
        const result = await applyCodexConfig(createPaths(args));
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
        }
        process.exitCode = 0;
      },
    }),
    doctor: defineCommand({
      meta: {
        name: 'doctor',
        description: 'Check repository .codex for unsafe runtime state.',
      },
      args: configArgs,
      async run({ args }) {
        const context = createCliContext(args);
        const result = await doctorCodexRepo(createPaths(args));
        if (!result.ok) {
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: false,
              command: 'codex doctor',
              unsafePaths: result.unsafePaths,
            });
          } else {
            processOutput.stderr.write(
              `Unsafe repository Codex content:\n${result.unsafePaths.join('\n')}\n`,
            );
          }
          process.exitCode = 1;
          return;
        }

        if (context.json) {
          writeJsonValue(processOutput, {
            ok: true,
            command: 'codex doctor',
            unsafePaths: [],
          });
        } else {
          writeHumanStatus(
            context,
            processOutput,
            'Codex repository config is safe.',
          );
        }
        process.exitCode = 0;
      },
    }),
  },
});
