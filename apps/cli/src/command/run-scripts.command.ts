import { intro, isCancel, select } from '@clack/prompts';
import { defineCommand } from 'citty';
import pc from 'picocolors';
import { listSelectable, resolvePackage } from '../domain/script-catalog';
import { runBundledScript } from '../flow/run-bundled-script';
import { getBundledScriptsRoot } from '../infra/bundled-scripts-root';
import { discoverScripts } from '../infra/discover-scripts';

export type SelectableRow = { readonly id: string; readonly title: string };

export type RunScriptsDeps = {
  readonly isInteractive: () => boolean;
  readonly pickScriptId: (
    rows: ReadonlyArray<SelectableRow>,
  ) => Promise<string | undefined>;
};

const defaultDeps: RunScriptsDeps = {
  isInteractive: () => process.stdin.isTTY === true,
  pickScriptId: async (rows) => {
    intro(pc.cyan('▶ Script Selection'));
    const choice = await select({
      message: 'Choose a bundled script to run',
      options: rows.map((o) => ({
        value: o.id,
        label: `${o.title} (${o.id})`,
      })),
    });
    if (isCancel(choice)) {
      return undefined;
    }
    return choice as string;
  },
};

function resolveExplicitId(args: {
  readonly id?: string;
  readonly script?: string;
}): string | undefined {
  const fromFlag = typeof args.script === 'string' ? args.script.trim() : '';
  const fromPos = typeof args.id === 'string' ? args.id.trim() : '';
  const resolved = fromFlag || fromPos;
  return resolved.length > 0 ? resolved : undefined;
}

export const createScriptsCommand = (deps: RunScriptsDeps = defaultDeps) =>
  defineCommand({
    meta: {
      name: 'scripts',
      description: [
        'Discover and run bundled scripts under apps/cli/src/scripts/<id>/ (script.json + index.ts).',
        '',
        'Examples:',
        '  cthutool-cli scripts hello-world',
        '  cthutool-cli scripts --script hello-world',
        '  bun run apps/cli/src/scripts/hello-world/index.ts',
      ].join('\n'),
    },
    args: {
      id: {
        type: 'positional',
        description: 'Script id (folder name under apps/cli/src/scripts/)',
        required: false,
      },
      script: {
        type: 'string',
        description: 'Same as positional id (for non-interactive CI)',
        alias: 's',
        valueHint: 'id',
      },
    },
    async run({ args }) {
      const root = getBundledScriptsRoot();
      const discovered = await discoverScripts(root);
      if (discovered.isErr()) {
        console.error(pc.red(discovered.error.message));
        process.exitCode = 1;
        return;
      }

      const catalog = discovered.value;
      for (const w of catalog.warnings) {
        console.error(pc.yellow(`${w.path}: ${w.message}`));
      }

      if (catalog.packages.length === 0) {
        console.error(
          pc.red(
            'no valid bundled script packages found (see apps/cli/src/scripts/)',
          ),
        );
        process.exitCode = 1;
        return;
      }

      const explicitId = resolveExplicitId(args);
      let targetId = explicitId;

      if (!targetId) {
        if (!deps.isInteractive()) {
          console.error(
            pc.red(
              'script id is required in non-interactive mode (use: cthutool-cli scripts <id> or --script <id>)',
            ),
          );
          process.exitCode = 1;
          return;
        }

        const options = listSelectable(catalog);
        if (options.length === 1) {
          const [only] = options;
          targetId = only.id;
        } else {
          const choice = await deps.pickScriptId(options);
          if (choice === undefined) {
            console.error(pc.red('selection cancelled'));
            process.exitCode = 1;
            return;
          }
          targetId = choice;
        }
      }

      const resolved = resolvePackage(catalog, targetId);
      if (resolved.isErr()) {
        if (resolved.error.kind === 'not_found') {
          console.error(pc.red(`unknown script id: ${resolved.error.id}`));
        } else {
          console.error(pc.red(`ambiguous script id: ${resolved.error.id}`));
        }
        process.exitCode = 1;
        return;
      }

      const executed = await runBundledScript(resolved.value);
      if (executed.isErr()) {
        const e = executed.error;
        const msg =
          e.kind === 'no_default_export'
            ? e.message
            : `${e.kind}: ${e.message}`;
        console.error(pc.red(msg));
        process.exitCode = 1;
        return;
      }

      process.exitCode = 0;
    },
  });

export const scriptsCommand = createScriptsCommand();
