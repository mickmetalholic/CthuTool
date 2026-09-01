import { defineCommand } from 'citty';
import {
  assertSelfUpdatePlanReady,
  createSelfUpdateDeps,
  getCliInstallationStatus,
  getCliVersion,
  planSelfUpdate,
  redactSelfUpdateText,
  runSelfUpdate,
  SelfUpdateError,
} from '../domain/self-update-manager';
import { type CliContext, cliContractArgs } from '../runtime/cli-context';
import { type CliError, createCliError } from '../runtime/cli-error';
import { runObservedCliCommand } from '../runtime/command-diagnostics';
import {
  processOutput,
  writeCommandError,
  writeJsonValue,
} from '../runtime/output';
import { createSelfUpdateRenderer } from './self-update-output';
import { renderCliInstallationStatus } from './self-update-status-output';

const selfUpdateSourceArgs = {
  repo: {
    type: 'string',
    description: 'Git repository URL to install from',
  },
  ref: {
    type: 'string',
    description: 'Git branch, tag, or commit to install',
  },
  'install-dir': {
    type: 'string',
    description: 'Local source checkout directory',
  },
} as const;

const selfUpdateArgs = {
  ...cliContractArgs,
  ...selfUpdateSourceArgs,
  check: {
    type: 'boolean',
    description: 'Check update availability without applying changes',
  },
  verbose: {
    type: 'boolean',
    description: 'Show bounded Git and npm command details',
  },
} as const;

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function toUpdateCliError(error: unknown): CliError {
  return error instanceof SelfUpdateError
    ? createCliError('update_failed', error.message)
    : createCliError(
        'update_failed',
        error instanceof Error ? error.message : 'update failed',
      );
}

function writeFailure(
  context: CliContext,
  cliError: CliError,
  error: unknown,
): void {
  if (context.json && error instanceof SelfUpdateError) {
    writeJsonValue(processOutput, {
      ok: false,
      error: {
        code: cliError.code,
        message: error.summary,
        phase: error.phase,
        cause: error.causeText,
        hint: error.hint,
      },
    });
  } else {
    writeCommandError(context, processOutput, cliError);
  }
  process.exitCode = cliError.exitCode;
}

function createUpdateCommand() {
  return defineCommand({
    meta: {
      name: 'update',
      description:
        'Update the global chc command from the CthuTool Git repository.',
    },
    args: selfUpdateArgs,
    async run({ args }) {
      await runObservedCliCommand(
        args,
        { command: 'update' },
        async ({ context, fail }) => {
          const repo = getStringArg(args.repo);
          const ref = getStringArg(args.ref);
          const installDir = getStringArg(args['install-dir']);
          const renderer = createSelfUpdateRenderer(context, {
            verbose: args.verbose === true,
          });
          const managerDeps = createSelfUpdateDeps(renderer.onEvent);

          try {
            if (args.check === true) {
              const result = await planSelfUpdate(
                { repo, ref, installDir },
                managerDeps,
              );
              assertSelfUpdatePlanReady(result);
              if (context.json) {
                writeJsonValue(processOutput, {
                  ok: true,
                  command: 'update',
                  result,
                });
              } else {
                renderer.renderCheckResult(result);
              }
              process.exitCode = 0;
              return;
            }
            const result = await runSelfUpdate(
              { repo, ref, installDir },
              managerDeps,
            );
            if (context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: 'update',
                result,
              });
            } else {
              renderer.renderApplyResult(result);
            }
            process.exitCode = 0;
          } catch (error) {
            renderer.stopForError(error);
            const cliError = toUpdateCliError(error);
            fail(cliError, {
              details: {
                installDir,
                ref,
                repo: repo ? redactSelfUpdateText(repo) : undefined,
                phase:
                  error instanceof SelfUpdateError ? error.phase : undefined,
              },
            });
            writeFailure(context, cliError, error);
          }
        },
      );
    },
  });
}

export const versionCommand = defineCommand({
  meta: {
    name: 'version',
    description: 'Print the current chc CLI version.',
  },
  args: cliContractArgs,
  async run({ args }) {
    await runObservedCliCommand(args, { command: 'version' }, ({ context }) => {
      const version = getCliVersion();
      if (context.json) {
        writeJsonValue(processOutput, {
          ok: true,
          command: 'version',
          version,
        });
      } else {
        processOutput.stdout.write(`chc ${version}\n`);
      }
      process.exitCode = 0;
    });
  },
});

export const statusCommand = defineCommand({
  meta: {
    name: 'status',
    description: 'Show chc CLI installation status.',
  },
  args: { ...cliContractArgs, ...selfUpdateSourceArgs },
  async run({ args }) {
    await runObservedCliCommand(
      args,
      { command: 'status' },
      async ({ context, fail }) => {
        try {
          const status = await getCliInstallationStatus({
            repo: getStringArg(args.repo),
            ref: getStringArg(args.ref),
            installDir: getStringArg(args['install-dir']),
          });
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: true,
              command: 'status',
              status,
            });
          } else {
            renderCliInstallationStatus(context, status);
          }
          process.exitCode = 0;
        } catch (error) {
          const cliError = toUpdateCliError(error);
          fail(cliError);
          writeFailure(context, cliError, error);
        }
      },
    );
  },
});

export const updateCommand = createUpdateCommand();
