import { homedir } from 'node:os';
import { join } from 'node:path';
import { intro, isCancel, multiselect } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  buildPluginRows,
  type CodexPluginRow,
  discoverCodexPlugins,
  type InstallCodexPluginResult,
  installCodexPlugins,
  readMarketplace,
  type SyncCodexPluginCacheResult,
  syncCodexPluginCache,
  withMarketplacePaths,
} from '../domain/codex-plugin-manager';
import { getCodexPluginsRoot } from '../infra/codex-plugins-root';
import { cliContractArgs, createCliContext } from '../runtime/cli-context';
import { createCliError } from '../runtime/cli-error';
import {
  processOutput,
  writeCommandError,
  writeHumanStatus,
  writeJsonValue,
} from '../runtime/output';

export type CodexPluginsDeps = {
  readonly isInteractive: () => boolean;
  readonly pickPluginNames: (
    rows: ReadonlyArray<CodexPluginRow>,
  ) => Promise<ReadonlyArray<string> | undefined>;
};

const defaultDeps: CodexPluginsDeps = {
  isInteractive: () => process.stdin.isTTY === true,
  pickPluginNames: async (rows) => {
    intro(pc.cyan('▶ Codex Plugins'));
    const selected = await multiselect({
      message: 'Install/update which plugins?',
      options: rows.map((row) => ({
        value: row.name,
        label: `${row.displayName} (${row.name})`,
        hint: formatStatus(row),
      })),
      required: false,
    });
    if (isCancel(selected)) {
      return undefined;
    }
    return selected as string[];
  },
};

function formatStatus(row: CodexPluginRow): string {
  if (row.status === 'installed') {
    return 'installed';
  }
  if (row.status === 'installed_elsewhere') {
    return `installed at ${row.installedPath}`;
  }
  return 'not installed';
}

function parsePluginSelection(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

type CodexPluginCommandResult =
  | InstallCodexPluginResult
  | SyncCodexPluginCacheResult;

type CodexPluginsCommandOptions = {
  readonly metaName?: string;
  readonly jsonCommand?: string;
  readonly description?: string;
  readonly examples?: readonly string[];
};

function writeStatusRows(input: {
  readonly marketplacePath: string;
  readonly rows: ReadonlyArray<CodexPluginRow>;
  readonly context: ReturnType<typeof createCliContext>;
}): void {
  writeHumanStatus(
    input.context,
    processOutput,
    pc.cyan('Codex plugin install status'),
  );
  writeHumanStatus(
    input.context,
    processOutput,
    `Marketplace: ${input.marketplacePath}`,
  );
  writeHumanStatus(input.context, processOutput);
  for (const row of input.rows) {
    writeHumanStatus(
      input.context,
      processOutput,
      `- ${row.displayName} (${row.name}) - ${formatStatus(row)}`,
    );
  }
}

function writeJsonResponse(input: {
  readonly command: string;
  readonly rows: ReadonlyArray<CodexPluginRow>;
  readonly results: ReadonlyArray<CodexPluginCommandResult>;
}): void {
  writeJsonValue(processOutput, {
    ok: true,
    command: input.command,
    plugins: input.rows,
    results: input.results,
  });
}

export const createCodexPluginsCommand = (
  deps: CodexPluginsDeps = defaultDeps,
  options: CodexPluginsCommandOptions = {},
) => {
  const metaName = options.metaName ?? 'plugins';
  const jsonCommand = options.jsonCommand ?? metaName;
  const examples = options.examples ?? [
    '  chc codex plugins',
    '  chc codex plugins --plugin english-coach',
    '  chc codex plugins --plugin english-coach --bump-patch',
    '  chc codex plugins --all',
  ];
  return defineCommand({
    meta: {
      name: metaName,
      description: [
        options.description ??
          'Check and install Codex plugins maintained under packages/codex-plugins/plugins.',
        '',
        'Examples:',
        ...examples,
      ].join('\n'),
    },
    args: {
      ...cliContractArgs,
      all: {
        type: 'boolean',
        description: 'Install or update all discovered Codex plugins',
      },
      plugin: {
        type: 'string',
        alias: 'p',
        description:
          'Plugin name to install or update. Use commas for multiple names.',
        valueHint: 'name',
      },
      pluginsRoot: {
        type: 'string',
        description:
          'Override the plugins directory for testing or custom layouts',
      },
      marketplace: {
        type: 'string',
        description: 'Override the personal marketplace.json path',
      },
      home: {
        type: 'string',
        description:
          'Override the home directory used for relative marketplace paths',
      },
      cacheRoot: {
        type: 'string',
        description: 'Override the Codex personal plugin cache directory',
      },
      syncCache: {
        type: 'boolean',
        description:
          'Refresh Codex plugin cache for selected plugins after install/update',
      },
      bumpPatch: {
        type: 'boolean',
        description:
          'Increment selected plugin patch versions and refresh their Codex cache',
      },
    },
    async run({ args }) {
      const context = createCliContext(args, { isTty: deps.isInteractive });
      const homeRoot =
        typeof args.home === 'string' && args.home.trim()
          ? args.home.trim()
          : homedir();
      const pluginsRoot =
        typeof args.pluginsRoot === 'string' && args.pluginsRoot.trim()
          ? args.pluginsRoot.trim()
          : getCodexPluginsRoot();
      const marketplacePath =
        typeof args.marketplace === 'string' && args.marketplace.trim()
          ? args.marketplace.trim()
          : join(homeRoot, '.agents', 'plugins', 'marketplace.json');
      const cacheRoot =
        typeof args.cacheRoot === 'string' && args.cacheRoot.trim()
          ? args.cacheRoot.trim()
          : join(homeRoot, '.codex', 'plugins', 'cache', 'personal');

      const discovered = withMarketplacePaths(
        await discoverCodexPlugins(pluginsRoot),
        homeRoot,
      );
      const marketplace = await readMarketplace(marketplacePath);
      const rows = buildPluginRows(discovered, marketplace);

      if (rows.length === 0) {
        const error = createCliError(
          'discovery_failed',
          `no Codex plugins found under ${pluginsRoot}`,
        );
        writeCommandError(context, processOutput, error);
        process.exitCode = error.exitCode;
        return;
      }

      writeStatusRows({ marketplacePath, rows, context });

      let selectedNames = parsePluginSelection(args.plugin);
      if (args.all === true) {
        selectedNames = rows.map((row) => row.name);
      }

      if (selectedNames.length === 0) {
        if (context.json || !context.interactive) {
          if (context.json) {
            writeJsonResponse({ command: jsonCommand, rows, results: [] });
          }
          process.exitCode = 0;
          return;
        }

        const picked = await deps.pickPluginNames(rows);
        if (picked === undefined) {
          const error = createCliError('invalid_option', 'selection cancelled');
          writeCommandError(context, processOutput, error);
          process.exitCode = error.exitCode;
          return;
        }
        selectedNames = [...picked];
      }

      const knownNames = new Set(rows.map((row) => row.name));
      const unknown = selectedNames.filter((name) => !knownNames.has(name));
      if (unknown.length > 0) {
        const error = createCliError(
          'unknown_selection',
          `unknown Codex plugin: ${unknown.join(', ')}`,
        );
        writeCommandError(context, processOutput, error);
        process.exitCode = error.exitCode;
        return;
      }

      const results = await installCodexPlugins({
        homeRoot,
        marketplacePath,
        plugins: discovered,
        selectedNames,
      });

      for (const result of results) {
        writeHumanStatus(
          context,
          processOutput,
          `${result.name}: ${result.action}`,
        );
      }

      const commandResults: CodexPluginCommandResult[] = [...results];
      if (args.syncCache === true || args.bumpPatch === true) {
        for (const plugin of discovered) {
          if (!selectedNames.includes(plugin.name)) {
            continue;
          }
          const result = await syncCodexPluginCache({
            cacheRoot,
            plugin,
            bumpPatch: args.bumpPatch === true,
          });
          commandResults.push(result);
          writeHumanStatus(
            context,
            processOutput,
            `${result.name}: synced cache ${result.version}`,
          );
        }
      }
      if (context.json) {
        writeJsonResponse({
          command: jsonCommand,
          rows,
          results: commandResults,
        });
      }
      process.exitCode = 0;
    },
  });
};
