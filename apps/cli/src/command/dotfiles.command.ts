import { lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { isCancel, multiselect, password, select } from '@clack/prompts';
import { type ArgsDef, defineCommand } from 'citty';
import { type AuthInteraction, ensureAuth } from '../domain/dotfiles/auth';
import {
  adoptFiles,
  applyConfiguration,
  type ConfigInteraction,
  chezmoi,
  managedTargets,
  saveBinding,
} from '../domain/dotfiles/configuration';
import { diagnose, installEntry } from '../domain/dotfiles/environment';
import { assertCompatibleHost, resolvePlan } from '../domain/dotfiles/model';
import {
  candidateSnapshot,
  normalizeNotion,
  readNotion,
} from '../domain/dotfiles/notion-sync';
import { NotionError, redactSecrets } from '../infra/dotfiles/notion-http';
import {
  GENERATED_FILES,
  loadSnapshot,
  MANIFEST,
  resolveSource,
  writableSource,
} from '../infra/dotfiles/source';
import {
  createDotfilesSystem,
  type DotfilesSystem,
} from '../infra/dotfiles/system';
import { ensureDotfilesTools } from '../infra/dotfiles/tooling';
import {
  publishSnapshot,
  recoverTransaction,
  withSourceLock,
} from '../infra/dotfiles/transaction';
import { cliContractArgs } from '../runtime/cli-context';
import { type CliErrorCode, createCliError } from '../runtime/cli-error';
import { runObservedCliCommand } from '../runtime/command-diagnostics';
import {
  processOutput,
  writeCommandError,
  writeJsonValue,
} from '../runtime/output';
import {
  type AnyCommandDef,
  buildRegisteredSubCommands,
  type CliCommandRegistration,
  registerCommandGroup,
} from './command-discovery';
import {
  createDotfilesRenderer,
  type DotfilesProgress,
  type DotfilesResults,
} from './dotfiles-output';

const sourceArg = {
  source: {
    type: 'string',
    description: 'Explicit CthuTool configuration source checkout',
  },
} as const;
const hostArg = {
  host: {
    type: 'string',
    description:
      'Canonical published host (this invocation only; init saves binding)',
  },
} as const;
const defaultAuth: AuthInteraction = {
  async hiddenToken() {
    const r = await password({
      message:
        'Notion API Token (read access to software, toolsets and hosts; stored privately on this machine)',
    });
    return isCancel(r) ? undefined : r;
  },
  async chooseAuth() {
    const r = await select({
      message:
        'Notion credentials (NOTION_TOKEN takes priority over the local cache)',
      options: [
        { value: 'reuse' as const, label: 'Continue using and validate' },
        { value: 'replace' as const, label: 'Replace cached Token' },
        { value: 'clear' as const, label: 'Clear local cache' },
      ],
    });
    return isCancel(r) ? undefined : r;
  },
};
const defaultConfig: ConfigInteraction = {
  async selectHost(ids) {
    if (!ids.length)
      throw new Error(
        'No compatible published hosts. Define/activate in Notion, publish reviewed snapshot, update checkout, then init.',
      );
    const r = await select({
      message: 'Bind this machine to a published host',
      options: ids.map((id) => ({ value: id, label: id })),
    });
    return isCancel(r) ? undefined : r;
  },
  async chooseFiles(paths) {
    if (!paths.length) return [];
    const r = await multiselect({
      message:
        'Select files to import (templates open the chezmoi merge tool; none applies automatically)',
      options: paths.map((p) => ({ value: p, label: p })),
      required: false,
    });
    return isCancel(r) ? [] : r;
  },
};
export type DotfilesCommandDeps = {
  system: DotfilesSystem;
  auth: AuthInteraction;
  config: ConfigInteraction;
  isTty: () => boolean;
};
export function createDotfilesCommand(
  overrides: Partial<DotfilesCommandDeps> = {},
) {
  const deps: DotfilesCommandDeps = {
    system: createDotfilesSystem(),
    auth: defaultAuth,
    config: defaultConfig,
    isTty: () => process.stdin.isTTY === true,
    ...overrides,
  };
  function leaf<K extends keyof DotfilesResults>(
    name: K,
    description: string,
    extra: ArgsDef,
    action: (
      args: Record<string, unknown>,
      interactive: boolean,
      report: (event: DotfilesProgress) => void,
    ) => Promise<DotfilesResults[K]>,
  ) {
    return defineCommand({
      meta: { name: name.split(' ').at(-1), description },
      args: { ...cliContractArgs, ...extra },
      async run({ args, rawArgs }) {
        await runObservedCliCommand(
          args,
          { command: 'dotfiles', subcommand: name },
          async (scope) => {
            const renderer = createDotfilesRenderer(scope.context, name);
            try {
              // Citty accepts unknown flags. Dotfiles intentionally has no mode/token/legacy aliases.
              const allowed = new Set([
                ...Object.keys(cliContractArgs),
                ...Object.keys(extra),
                'no-interactive',
              ]);
              for (const arg of rawArgs)
                if (
                  arg.startsWith('--') &&
                  !allowed.has(arg.slice(2).split('=')[0]) &&
                  arg !== '--'
                )
                  throw new Error(
                    `Unknown dotfiles option: ${arg.split('=')[0]}`,
                  );
              renderer.start();
              const result = await action(
                args,
                scope.context.isTty &&
                  scope.context.interactive &&
                  !scope.context.json,
                renderer.progress,
              );
              if (scope.context.json)
                writeJsonValue(processOutput, {
                  ok: true,
                  command: `dotfiles ${name}`,
                  result,
                });
              else renderer.result(name, result);
              process.exitCode =
                'blockingFailures' in result && result.blockingFailures > 0
                  ? 1
                  : 0;
            } catch (error) {
              const code = (
                error instanceof NotionError ? error.code : 'dotfiles_failed'
              ) as CliErrorCode;
              const e = createCliError(
                code,
                redactSecrets(
                  error instanceof Error
                    ? error.message
                    : 'Dotfiles operation failed',
                ),
              );
              scope.fail(e);
              writeCommandError(scope.context, processOutput, e);
              process.exitCode = e.exitCode;
            }
          },
          { isTty: deps.isTty },
        );
      },
    });
  }
  const string = (v: unknown) =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined;
  async function bound(args: Record<string, unknown>, required = true) {
    const resolved = await resolveSource(deps.system, string(args.source));
    const snapshot = await loadSnapshot(resolved.source);
    const host = string(args.host) ?? resolved.binding.host;
    if (host) assertCompatibleHost(snapshot.catalog, host, deps.system);
    else if (required)
      throw new Error(
        'Host is not bound. Run chc dotfiles init --host <published-id>.',
      );
    return { ...resolved, ...snapshot, host };
  }
  const init = leaf(
    'init',
    'Prepare tooling, bind a published host and review existing home files',
    {
      ...sourceArg,
      ...hostArg,
      'migrate-from': {
        type: 'string',
        description:
          'Explicit previous chezmoi source to migrate, preserving backup',
      },
    },
    async (args, interactive, report) => {
      report({
        type: 'environment',
        os: deps.system.os,
        arch: deps.system.arch,
        wsl: deps.system.wsl,
        node: process.version,
      });
      const tools = await ensureDotfilesTools(deps.system, report);
      report({
        type: 'phase',
        title: 'Host binding',
        detail: 'Preparing published host selection…',
      });
      const { source } = await resolveSource(deps.system, string(args.source));
      const { catalog } = await loadSnapshot(source);
      const result = await saveBinding(deps.system, {
        source,
        host: string(args.host),
        migrateFrom: string(args['migrate-from']),
        interactive,
        interaction: deps.config,
        catalog,
      });
      let adoption: DotfilesResults['init']['adoption'];
      if (interactive) {
        const targets = await managedTargets(deps.system, source, result.host);
        const existing = [];
        for (const path of targets) {
          if (path === join(deps.system.home, '.ssh/config')) continue;
          try {
            await lstat(path);
            existing.push(path);
          } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
          }
        }
        const paths = await deps.config.chooseFiles(existing);
        if (paths.length)
          adoption = await adoptFiles(
            deps.system,
            source,
            result.host,
            paths,
            true,
          );
      }
      return {
        ...result,
        environment: {
          os: deps.system.os,
          arch: deps.system.arch,
          wsl: deps.system.wsl,
          node: process.version,
          tools,
        },
        plan: resolvePlan(catalog, result.host),
        adoption,
        next: [
          'chc dotfiles env setup --dry-run',
          'chc dotfiles config diff',
          'chc dotfiles config apply',
          'mise install',
        ],
      };
    },
  );
  const setup = leaf(
    'env setup',
    'Install host software only; --dry-run previews without mutation',
    {
      ...hostArg,
      'dry-run': {
        type: 'boolean',
        description: 'Report a plan without running installers',
      },
    },
    async (args, interactive, report) => {
      const b = await bound(args);
      const plan = resolvePlan(b.catalog, b.host as string);
      if (args['dry-run']) return { source: b.source, dryRun: true, plan };
      const results: Exclude<
        DotfilesResults['env setup'],
        { dryRun: true }
      >['results'] = [];
      for (const [index, e] of plan.entries.entries()) {
        report({
          type: 'phase',
          title: `Software ${index + 1}/${plan.entries.length} · ${e.id}`,
          detail: 'Checking availability and installation policy…',
        });
        try {
          results.push(
            await installEntry(e, {
              ...deps.system,
              run: (command, args, options = {}) =>
                deps.system.run(command, args, {
                  ...options,
                  live: interactive,
                }),
            }),
          );
        } catch (error) {
          results.push({
            id: e.id,
            status: 'failed',
            detail: redactSecrets(
              error instanceof Error ? error.message : 'Installation failed',
            ),
          });
        }
      }
      return {
        plan,
        results,
        blockingFailures: results.filter((r) => r.status === 'failed').length,
        next: 'Review config diff/apply and run mise install separately.',
      };
    },
  );
  const doctor = leaf(
    'env doctor',
    'Read actual machine health and Git identity; works without Notion',
    hostArg,
    async (args) => {
      const b = await bound(args, false);
      const entries = b.host ? resolvePlan(b.catalog, b.host).entries : [];
      return {
        source: b.source,
        host: b.host ?? null,
        bindingIssue: b.host
          ? undefined
          : 'Unbound: run chc dotfiles init; no software plan inferred',
        ...(await diagnose(entries, deps.system)),
      };
    },
  );
  const add = leaf(
    'config add',
    'Use chezmoi add for files and its configured merge tool for templates',
    {
      path: {
        type: 'positional',
        required: false,
        description: 'One or more explicit home file paths',
      },
    },
    async (args, interactive) => {
      const b = await bound(args);
      const paths = Array.isArray(args._)
        ? args._.filter((p): p is string => typeof p === 'string')
        : [];
      return adoptFiles(
        deps.system,
        b.source,
        b.host as string,
        paths,
        interactive,
      );
    },
  );
  const diff = leaf(
    'config diff',
    'Compare rendered repository templates with actual home files',
    hostArg,
    async (args) => {
      const b = await bound(args);
      return {
        output: await chezmoi(deps.system, b.source, b.host as string, [
          'diff',
          '--include',
          'files,symlinks',
        ]),
      };
    },
  );
  const apply = leaf(
    'config apply',
    'Back up files and apply with native chezmoi conflict prompts',
    hostArg,
    async (args, interactive, report) => {
      const b = await bound(args);
      report({
        type: 'phase',
        title: 'Home configuration',
        detail:
          'Backing up files and starting native chezmoi conflict handling…',
      });
      return applyConfiguration(
        deps.system,
        b.source,
        b.host as string,
        interactive,
      );
    },
  );
  const auth = leaf(
    'notion auth',
    'Validate, replace or clear the local Token cache (interactive menu)',
    sourceArg,
    async (args, interactive) => {
      const result = await ensureAuth({
        system: deps.system,
        source: async () =>
          (await resolveSource(deps.system, string(args.source))).source,
        interactive,
        interaction: deps.auth,
        manage: true,
      });
      return result.cleared
        ? {
            cleared: true,
            environmentStillActive: result.environmentStillActive,
          }
        : { authenticated: true, credentialSource: result.credentialSource };
    },
  );
  const validate = leaf(
    'notion validate',
    'Offline validation of snapshot model, digests and references; no Token',
    sourceArg,
    async (args) => {
      const { source } = await resolveSource(deps.system, string(args.source));
      const b = await loadSnapshot(source);
      return {
        source,
        valid: true,
        hosts: Object.keys(b.catalog.hosts),
        modelVersion: b.manifest.modelVersion,
        alignmentReviewed: b.manifest.alignmentReviewed,
      };
    },
  );
  function syncCommand(pull: boolean) {
    return leaf(
      `notion ${pull ? 'pull' : 'diff'}`,
      pull
        ? 'Publish Notion plan data to local YAML/manifest; no Git commit or machine changes'
        : 'Compare Notion API plan data with the local published YAML snapshot; first auth may cache Token',
      {
        ...sourceArg,
        ...(pull
          ? {
              'allow-retire': {
                type: 'string' as const,
                description:
                  'Comma-separated group:stable-key retirements explicitly acknowledged',
              },
            }
          : {}),
      },
      async (args, interactive, report) => {
        const { source } = await resolveSource(
          deps.system,
          string(args.source),
        );
        async function sync() {
          if (pull) await recoverTransaction(source);
          const old = await loadSnapshot(source);
          const baseline = {
            ...old.files,
            [MANIFEST]: old.manifestText,
          };
          report({
            type: 'phase',
            title: 'Notion access',
            detail: 'Verifying credentials and data source access…',
          });
          const auth = await ensureAuth({
            system: deps.system,
            source: async () => source,
            interactive,
            interaction: deps.auth,
          });
          if (!('client' in auth) || !auth.client)
            throw new Error('Authentication did not produce an API client');
          report({
            type: 'phase',
            title: 'Notion data',
            detail: 'Reading software, toolsets and hosts…',
          });
          const data = await readNotion(auth.client);
          const normalized = normalizeNotion(data, old.catalog, old.manifest);
          const candidate = candidateSnapshot(
            normalized,
            old.manifest,
            old.files,
          );
          const changes: { path: string; before: string; after: string }[] =
            GENERATED_FILES.filter(
              (f) => candidate.files[f] !== old.files[f],
            ).map((path) => ({
              path,
              before: old.files[path],
              after: candidate.files[path],
            }));
          if (
            candidate.hasChanges &&
            candidate.files[MANIFEST] !== baseline[MANIFEST]
          )
            changes.push({
              path: MANIFEST,
              before: baseline[MANIFEST],
              after: candidate.files[MANIFEST],
            });
          if (pull) {
            if (!old.manifest.alignmentReviewed)
              throw new Error(
                'First Notion alignment is not reviewed. Complete docs/dotfiles/reconciliation.md before publication.',
              );
            const acknowledgements = new Set(
              (string(args['allow-retire']) ?? '').split(',').filter(Boolean),
            );
            for (const key of candidate.retired)
              if (!acknowledgements.has(key))
                throw new Error(
                  `Explicit retirement acknowledgement required: --allow-retire ${key}`,
                );
            for (const key of acknowledgements)
              if (!candidate.retired.includes(key))
                throw new Error(`Unknown retirement acknowledgement: ${key}`);
            if (candidate.hasChanges)
              await publishSnapshot(source, candidate.files, baseline);
          }
          return {
            source,
            hasChanges: candidate.hasChanges,
            changes,
            retired: candidate.retired,
            published: pull && candidate.hasChanges,
            generation: pull
              ? candidate.manifest.generation
              : old.manifest.generation,
            alignmentReviewed: old.manifest.alignmentReviewed,
          };
        }
        if (pull) {
          await writableSource(source, deps.system);
          return withSourceLock(source, sync);
        }
        return sync();
      },
    );
  }
  function group(
    name: string,
    description: string,
    children: Record<string, AnyCommandDef>,
  ) {
    const registrations: CliCommandRegistration[] = Object.entries(
      children,
    ).map(([name, command]) => ({
      name,
      command,
      visibility: 'public',
      bareBehavior:
        name === 'env' || name === 'config' || name === 'notion'
          ? 'help'
          : 'run',
    }));
    return registerCommandGroup(
      defineCommand({
        meta: { name, description },
        subCommands: buildRegisteredSubCommands(registrations),
      }),
      registrations,
    );
  }
  return group(
    'dotfiles',
    'Bind a machine; manage software, home files and Notion plan snapshots',
    {
      init,
      env: group(
        'env',
        'Software environment: explicit installation and actual machine health',
        { setup, doctor },
      ),
      config: group(
        'config',
        'Home files: local adoption, rendered diff and explicit apply',
        { add, diff, apply },
      ),
      notion: group(
        'notion',
        'Notion plan data: credentials, API diff/pull and offline snapshot validation',
        { auth, diff: syncCommand(false), pull: syncCommand(true), validate },
      ),
    },
  );
}
export const dotfilesCommand = createDotfilesCommand();
