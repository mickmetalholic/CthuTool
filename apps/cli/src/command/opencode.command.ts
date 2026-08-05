import { defineCommand } from 'citty';
import pc from 'picocolors';
import { discoverEnabledRepositoryCodexPlugins } from '../domain/codex-plugin-install-manager';
import {
  syncOpenCodeMcpServers,
  syncOpenCodeSkillPaths,
} from '../domain/opencode-config-manager';
import { createCodexConfigPaths } from '../infra/codex-config-paths';
import { cliContractArgs } from '../runtime/cli-context';
import {
  type ObservedCliCommandScope,
  runObservedCliCommand,
} from '../runtime/command-diagnostics';
import {
  processOutput,
  writeHumanStatus,
  writeJsonValue,
} from '../runtime/output';

const commonArgs = {
  ...cliContractArgs,
  repoRoot: { type: 'string', description: 'Override the repository root' },
  home: { type: 'string', description: 'Override the home directory' },
  pluginsRoot: {
    type: 'string',
    description: 'Override the repository-managed codex/plugins directory',
  },
  openCodeHome: {
    type: 'string',
    description: 'Override the OpenCode configuration directory',
  },
  openCodeConfig: {
    type: 'string',
    description: 'Override the OpenCode JSON or JSONC config path',
  },
} as const;

type OpenCodeArgs = {
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
  readonly repoRoot?: unknown;
  readonly home?: unknown;
  readonly pluginsRoot?: unknown;
  readonly openCodeHome?: unknown;
  readonly openCodeConfig?: unknown;
};

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function createPaths(args: OpenCodeArgs) {
  return createCodexConfigPaths({
    repoRoot: getStringArg(args.repoRoot),
    homeRoot: getStringArg(args.home),
    pluginsRoot: getStringArg(args.pluginsRoot),
    openCodeHome: getStringArg(args.openCodeHome),
    openCodeConfig: getStringArg(args.openCodeConfig),
  });
}

async function runObservedOpenCodeSubcommand(
  subcommand: string,
  args: OpenCodeArgs,
  run: (scope: ObservedCliCommandScope) => Promise<void> | void,
): Promise<void> {
  await runObservedCliCommand(args, { command: 'opencode', subcommand }, run);
}

async function runSkills(
  args: OpenCodeArgs,
  scope: ObservedCliCommandScope,
): Promise<void> {
  const paths = createPaths(args);
  const plugins = await discoverEnabledRepositoryCodexPlugins(paths);
  const result = await syncOpenCodeSkillPaths({
    configPath: paths.openCodeConfigPath,
    plugins,
  });

  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: 'opencode skills',
      result,
    });
  } else {
    writeHumanStatus(scope.context, processOutput, pc.cyan('OpenCode skills'));
    writeHumanStatus(
      scope.context,
      processOutput,
      `${result.changed ? 'updated' : 'unchanged'} ${result.configPath}`,
    );
    for (const plugin of result.plugins) {
      writeHumanStatus(
        scope.context,
        processOutput,
        `${plugin.name}: ${plugin.paths.join(', ')}`,
      );
    }
    if (result.plugins.length === 0) {
      writeHumanStatus(
        scope.context,
        processOutput,
        pc.dim('(no plugin skills)'),
      );
    }
  }
  process.exitCode = 0;
}

async function runMcp(
  args: OpenCodeArgs,
  scope: ObservedCliCommandScope,
): Promise<void> {
  const paths = createPaths(args);
  const plugins = await discoverEnabledRepositoryCodexPlugins(paths);
  const result = await syncOpenCodeMcpServers({
    configPath: paths.openCodeConfigPath,
    plugins,
  });

  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: 'opencode mcp',
      result,
    });
  } else {
    writeHumanStatus(scope.context, processOutput, pc.cyan('OpenCode MCP'));
    writeHumanStatus(
      scope.context,
      processOutput,
      `${result.changed ? 'updated' : 'unchanged'} ${result.configPath}`,
    );
    for (const server of result.servers) {
      writeHumanStatus(
        scope.context,
        processOutput,
        `${server.name} <- ${server.plugin}`,
      );
    }
    if (result.servers.length === 0) {
      writeHumanStatus(
        scope.context,
        processOutput,
        pc.dim('(no plugin MCP servers)'),
      );
    }
  }
  process.exitCode = 0;
}

export const opencodeCommand = defineCommand({
  meta: {
    name: 'opencode',
    description: 'Sync shared CthuCodex skills and MCP servers to OpenCode.',
  },
  subCommands: {
    skills: defineCommand({
      meta: {
        name: 'skills',
        description: 'Expose repository plugin skills to OpenCode.',
      },
      args: commonArgs,
      async run({ args }) {
        await runObservedOpenCodeSubcommand('skills', args, async (scope) => {
          await runSkills(args, scope);
        });
      },
    }),
    mcp: defineCommand({
      meta: {
        name: 'mcp',
        description: 'Sync repository plugin MCP servers to OpenCode.',
      },
      args: commonArgs,
      async run({ args }) {
        await runObservedOpenCodeSubcommand('mcp', args, async (scope) => {
          await runMcp(args, scope);
        });
      },
    }),
  },
});
