import { confirm, isCancel } from '@clack/prompts';
import { type ArgsDef, defineCommand } from 'citty';
import {
  AGENT_CLI_RESPONSE_SCHEMA_VERSION,
  type AgentLifecycleService,
} from '../domain/agent-lifecycle';
import { FileSystemAgentLifecycleService } from '../infra/agent-lifecycle-service';
import { type CliContext, cliContractArgs } from '../runtime/cli-context';
import { type CliErrorCode, createCliError } from '../runtime/cli-error';
import { runObservedCliCommand } from '../runtime/command-diagnostics';
import {
  processOutput,
  writeCommandError,
  writeHumanStatus,
  writeJsonValue,
} from '../runtime/output';
import {
  type AnyCommandDef,
  buildRegisteredSubCommands,
  type CliCommandRegistration,
  registerCommandGroup,
} from './command-discovery';

const lifecycleArgs = { ...cliContractArgs } satisfies ArgsDef;
type CommandArgs = Record<string, unknown> & {
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
};

export function createAgentCommand(service: AgentLifecycleService) {
  const install = defineCommand({
    meta: {
      name: 'install',
      description: 'Install a verified local Agent release.',
    },
    args: {
      ...lifecycleArgs,
      channel: {
        type: 'string',
        description: 'Release channel: stable or beta',
        default: 'stable',
      },
      version: {
        type: 'string',
        description: 'Install an immutable release version',
      },
    },
    run: ({ args }) =>
      execute(
        args,
        'install',
        () =>
          service.install({
            channel: parseChannel(args.channel),
            version: stringValue(args.version),
          }),
        installationMessage,
      ),
  });
  const update = defineCommand({
    meta: {
      name: 'update',
      description:
        'Update only the local Agent and roll back on failed readiness.',
    },
    args: {
      ...lifecycleArgs,
      channel: {
        type: 'string',
        description: 'Release channel: stable or beta',
        default: 'stable',
      },
    },
    run: ({ args }) =>
      execute(
        args,
        'update',
        () => service.update({ channel: parseChannel(args.channel) }),
        installationMessage,
      ),
  });
  const start = simpleCommand(
    'start',
    'Start the tray-owned local Agent.',
    service.start.bind(service),
  );
  const stop = simpleCommand(
    'stop',
    'Stop the tray and its local Agent.',
    service.stop.bind(service),
  );
  const restart = simpleCommand(
    'restart',
    'Restart the tray-owned local Agent.',
    service.restart.bind(service),
  );
  const status = defineCommand({
    meta: {
      name: 'status',
      description:
        'Show install, tray, environment, backend, browser, and autostart status.',
    },
    args: lifecycleArgs,
    run: ({ args }) =>
      execute(
        args,
        'status',
        () => service.status(),
        (result) => {
          const value = result as Awaited<
            ReturnType<AgentLifecycleService['status']>
          >;
          return value.installed
            ? `CthuTool Agent ${value.version}: tray ${value.tray.state}; environment ${value.environment?.id ?? 'none'}; backend ${value.backend.status}; browser ${value.browser.status}; autostart ${value.autostart.enabled ? 'enabled' : 'disabled'}.`
            : 'CthuTool Agent is not installed.';
        },
      ),
  });
  const settings = simpleCommand(
    'settings',
    'Start the Agent if needed and open a fresh deployed-Web settings session.',
    service.settings.bind(service),
  );
  const logs = defineCommand({
    meta: {
      name: 'logs',
      description: 'Read or follow the redacted Agent-owned log.',
    },
    args: {
      ...lifecycleArgs,
      lines: {
        type: 'string',
        description: 'Number of recent lines',
        default: '200',
      },
      follow: {
        type: 'boolean',
        alias: 'f',
        description: 'Follow new redacted log lines',
      },
    },
    async run({ args }) {
      const lines = parseLineCount(args.lines);
      if (args.follow === true && args.json === true)
        throw createCliError(
          'invalid_option',
          '--json cannot be combined with --follow',
        );
      await execute(
        args,
        'logs',
        () => service.logs({ lines }),
        (result) => (result as readonly string[]).join('\n'),
      );
      if (args.follow === true) await followLogs(service, lines);
    },
  });
  const doctor = defineCommand({
    meta: {
      name: 'doctor',
      description:
        'Run integrity, local-control, environment, browser, and log diagnostics.',
    },
    args: lifecycleArgs,
    run: ({ args }) =>
      execute(
        args,
        'doctor',
        () => service.doctor(),
        (result) =>
          (
            result as readonly {
              readonly id: string;
              readonly status: string;
              readonly message: string;
            }[]
          )
            .map(
              (check) =>
                `${check.status.toUpperCase()} ${check.id}: ${check.message}`,
            )
            .join('\n'),
      ),
  });
  const uninstall = defineCommand({
    meta: {
      name: 'uninstall',
      description:
        'Remove Agent binaries and autostart; preserve data unless --purge is confirmed.',
    },
    args: {
      ...lifecycleArgs,
      purge: {
        type: 'boolean',
        description: 'Also remove environment selection, profiles, and logs',
      },
      yes: {
        type: 'boolean',
        alias: 'y',
        description: 'Confirm destructive purge in non-interactive use',
      },
    },
    async run({ args }) {
      await runWithContext(
        args,
        'uninstall',
        async (context) => {
          let confirmed = args.yes === true;
          if (args.purge === true && !confirmed && context.interactive) {
            const answer = await confirm({
              message:
                'Permanently delete Agent profiles, selection, and logs?',
              initialValue: false,
            });
            confirmed = !isCancel(answer) && answer === true;
          }
          if (args.purge === true && !confirmed)
            throw createCliError(
              'agent_purge_confirmation_required',
              'Purging Agent data requires --yes or interactive confirmation',
            );
          return service.uninstall({ purge: args.purge === true, confirmed });
        },
        (result) => {
          const value = result as {
            readonly purged: boolean;
            readonly preservedDataDir?: string;
          };
          return value.purged
            ? 'CthuTool Agent binaries and mutable data removed.'
            : `CthuTool Agent binaries removed. Mutable data preserved at ${value.preservedDataDir}.`;
        },
      );
    },
  });

  const envList = defineCommand({
    meta: { name: 'list', description: 'List verified release environments.' },
    args: lifecycleArgs,
    run: ({ args }) =>
      execute(
        args,
        'env list',
        () => service.listEnvironments(),
        environmentListMessage,
      ),
  });
  const envGet = defineCommand({
    meta: {
      name: 'get',
      description: 'Show the active or named environment.',
    },
    args: {
      ...lifecycleArgs,
      id: {
        type: 'positional',
        required: false,
        description: 'Environment id',
      },
    },
    run: ({ args }) =>
      execute(
        args,
        'env get',
        () => service.getEnvironment(stringValue(args.id)),
        environmentMessage,
      ),
  });
  const envSet = defineCommand({
    meta: {
      name: 'set',
      description:
        'Select a verified environment for the running or stopped Agent.',
    },
    args: {
      ...lifecycleArgs,
      id: { type: 'positional', required: true, description: 'Environment id' },
    },
    run: ({ args }) =>
      execute(
        args,
        'env set',
        () => service.setEnvironment(requiredString(args.id, 'environment id')),
        (result) =>
          `Active Agent environment: ${(result as { readonly id: string }).id}.`,
      ),
  });
  const envRegistrations: readonly CliCommandRegistration[] = [
    registration('list', envList),
    registration('get', envGet),
    registration('set', envSet),
  ];
  const environment = registerCommandGroup(
    defineCommand({
      meta: {
        name: 'env',
        description: 'Manage verified Agent environments.',
      },
      subCommands: buildRegisteredSubCommands(envRegistrations),
    }),
    envRegistrations,
  );

  const autostartCommands = (['enable', 'disable', 'status'] as const).map(
    (action) => ({
      action,
      command: defineCommand({
        meta: {
          name: action,
          description: `${action[0]?.toUpperCase()}${action.slice(1)} per-user Agent autostart.`,
        },
        args: lifecycleArgs,
        run: ({ args }) =>
          execute(
            args,
            `autostart ${action}`,
            () => service.autostart(action),
            (result) => {
              const value = result as {
                readonly enabled: boolean;
                readonly supported: boolean;
              };
              return value.supported
                ? `Agent autostart is ${value.enabled ? 'enabled' : 'disabled'}.`
                : 'Agent autostart is unsupported on this platform.';
            },
          ),
      }),
    }),
  );
  const autostartRegistrations = autostartCommands.map(({ action, command }) =>
    registration(action, command),
  );
  const autostart = registerCommandGroup(
    defineCommand({
      meta: {
        name: 'autostart',
        description: 'Manage per-user tray autostart.',
      },
      subCommands: buildRegisteredSubCommands(autostartRegistrations),
    }),
    autostartRegistrations,
  );

  const registrations: readonly CliCommandRegistration[] = [
    registration('install', install),
    registration('update', update),
    registration('start', start),
    registration('stop', stop),
    registration('restart', restart),
    registration('status', status),
    registration('settings', settings),
    registration('logs', logs),
    registration('env', environment, 'help'),
    registration('autostart', autostart, 'help'),
    registration('doctor', doctor),
    registration('uninstall', uninstall),
  ];
  return {
    command: registerCommandGroup(
      defineCommand({
        meta: {
          name: 'agent',
          description: 'Install and control the local CthuTool Agent.',
        },
        subCommands: buildRegisteredSubCommands(registrations),
      }),
      registrations,
    ),
    registrations,
  };
}

const defaultAgentCommand = createAgentCommand(
  new FileSystemAgentLifecycleService(),
);
export const agentCommand = defaultAgentCommand.command;
export const agentCommandRegistrations = defaultAgentCommand.registrations;

function simpleCommand(
  name: string,
  description: string,
  operation: () => Promise<unknown>,
) {
  return defineCommand({
    meta: { name, description },
    args: lifecycleArgs,
    run: ({ args }) =>
      execute(
        args,
        name,
        operation,
        (result) => `CthuTool Agent ${String(result).replaceAll('-', ' ')}.`,
      ),
  });
}

function registration(
  name: string,
  command: AnyCommandDef,
  bareBehavior: 'help' | 'run' = 'run',
): CliCommandRegistration {
  return { name, command, visibility: 'public', bareBehavior };
}

async function execute<T>(
  args: CommandArgs,
  path: string,
  operation: () => Promise<T>,
  human: (result: T) => string,
): Promise<void> {
  await runWithContext(args, path, () => operation(), human);
}

async function runWithContext<T>(
  args: CommandArgs,
  path: string,
  operation: (context: CliContext) => Promise<T>,
  human: (result: T) => string,
): Promise<void> {
  await runObservedCliCommand(
    args,
    { command: 'agent', subcommand: path },
    async ({ context, fail }) => {
      try {
        const result = await operation(context);
        if (context.json)
          writeJsonValue(processOutput, {
            schemaVersion: AGENT_CLI_RESPONSE_SCHEMA_VERSION,
            ok: true,
            command: `agent ${path}`,
            result: result as Record<string, unknown>,
          });
        else writeHumanStatus(context, processOutput, human(result));
        process.exitCode = 0;
      } catch (error) {
        const cliError =
          error instanceof Error && 'code' in error && 'exitCode' in error
            ? (error as ReturnType<typeof createCliError>)
            : createCliError(
                classifyAgentError(error),
                safeErrorMessage(error),
              );
        fail(cliError);
        if (context.json) {
          writeJsonValue(processOutput, {
            schemaVersion: AGENT_CLI_RESPONSE_SCHEMA_VERSION,
            ok: false,
            command: `agent ${path}`,
            error: { code: cliError.code, message: cliError.message },
          });
        } else {
          writeCommandError(context, processOutput, cliError);
        }
        process.exitCode = cliError.exitCode;
        throw cliError;
      }
    },
  );
}

function classifyAgentError(error: unknown): CliErrorCode {
  const message = safeErrorMessage(error).toLowerCase();
  if (message.includes('not installed')) return 'agent_not_installed';
  if (
    message.includes('pinned public key') ||
    message.includes('signature') ||
    message.includes('untrusted')
  )
    return 'agent_release_untrusted';
  if (
    message.includes('digest') ||
    message.includes('archive') ||
    message.includes('catalog') ||
    message.includes('layout') ||
    message.includes('canonical')
  )
    return 'agent_integrity_failed';
  if (
    message.includes('supports macos') ||
    message.includes('incompatible') ||
    message.includes('requires chc')
  )
    return 'agent_incompatible';
  if (
    message.includes('unknown agent environment') ||
    message.includes('no agent environment')
  )
    return 'agent_environment_invalid';
  if (message.includes('timed out waiting') && message.includes('ready'))
    return 'agent_start_failed';
  if (message.includes('purging agent data'))
    return 'agent_purge_confirmation_required';
  return 'agent_control_failed';
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unable to complete Agent command';
}

function parseChannel(value: unknown): 'stable' | 'beta' {
  if (value === undefined || value === 'stable') return 'stable';
  if (value === 'beta') return 'beta';
  throw createCliError(
    'invalid_option',
    'Agent release channel must be stable or beta',
  );
}

function parseLineCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10_000)
    throw createCliError(
      'invalid_option',
      '--lines must be an integer from 1 to 10000',
    );
  return parsed;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function requiredString(value: unknown, label: string): string {
  const result = stringValue(value);
  if (!result)
    throw createCliError(
      'missing_required_argument',
      `Missing required ${label}`,
    );
  return result;
}

function environmentListMessage(result: unknown): string {
  return (
    result as readonly {
      readonly id: string;
      readonly label: string;
      readonly active: boolean;
    }[]
  )
    .map(
      (environment) =>
        `${environment.active ? '*' : ' '} ${environment.id}\t${environment.label}`,
    )
    .join('\n');
}
function environmentMessage(result: unknown): string {
  const environment = result as {
    readonly id: string;
    readonly label: string;
    readonly active: boolean;
    readonly webOrigin: string;
    readonly backendHttpUrl: string;
  };
  return `${environment.active ? 'Active ' : ''}${environment.id} (${environment.label})\nWeb: ${environment.webOrigin}\nBackend: ${environment.backendHttpUrl}`;
}
function installationMessage(result: unknown): string {
  const value = result as {
    readonly version: string;
    readonly changed: boolean;
  };
  return `CthuTool Agent ${value.version} ${value.changed ? 'activated' : 'already installed'}.`;
}

async function followLogs(
  service: AgentLifecycleService,
  initialLines: number,
): Promise<void> {
  let seen = (await service.logs({ lines: 10_000 })).length;
  let stopped = false;
  const stop = () => {
    stopped = true;
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    while (!stopped) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const lines = await service.logs({ lines: 10_000 });
      if (lines.length < seen) seen = 0;
      for (const line of lines.slice(seen))
        processOutput.stdout.write(`${line}\n`);
      seen = lines.length;
    }
  } finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
  }
  void initialLines;
}
