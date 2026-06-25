import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  createSelfUpdateDeps,
  defaultSelfUpdateRef,
  defaultSelfUpdateRepo,
  getCliInstallationStatus,
  getCliVersion,
  getDefaultSelfUpdateInstallDir,
  runSelfUpdate,
  SelfUpdateError,
  type SelfUpdateStep,
} from '../domain/self-update-manager';
import { type CliContext, cliContractArgs } from '../runtime/cli-context';
import { type CliError, createCliError } from '../runtime/cli-error';
import { runObservedCliCommand } from '../runtime/command-diagnostics';
import {
  processOutput,
  writeCommandError,
  writeHumanStatus,
  writeJsonValue,
} from '../runtime/output';

const selfUpdateArgs = {
  ...cliContractArgs,
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

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function formatStep(step: SelfUpdateStep): string {
  switch (step) {
    case 'clone':
      return 'cloning repository';
    case 'fetch':
      return 'fetching repository';
    case 'checkout':
      return 'checking out ref';
    case 'pull':
      return 'fast-forwarding branch';
    case 'verify-bundle':
      return 'verifying committed CLI bundle';
    case 'install-global':
      return 'installing global command';
  }
}

function toSelfUpdateCliError(error: unknown): CliError {
  return error instanceof SelfUpdateError
    ? createCliError('self_update_failed', error.message)
    : createCliError(
        'self_update_failed',
        error instanceof Error ? error.message : 'self-update failed',
      );
}

function writeFailure(context: CliContext, cliError: CliError): void {
  writeCommandError(context, processOutput, cliError);
  process.exitCode = cliError.exitCode;
}

function createUpdateCommand(name: 'update' | 'self-update') {
  return defineCommand({
    meta: {
      name,
      description:
        'Update the global chc command from the CthuTool Git repository.',
    },
    args: selfUpdateArgs,
    async run({ args }) {
      await runObservedCliCommand(
        args,
        { command: name },
        async ({ context, fail }) => {
          const repo = getStringArg(args.repo);
          const ref = getStringArg(args.ref);
          const installDir = getStringArg(args['install-dir']);

          writeHumanStatus(
            context,
            processOutput,
            pc.cyan(
              name === 'self-update'
                ? 'CthuTool self-update'
                : 'CthuTool update',
            ),
          );
          writeHumanStatus(
            context,
            processOutput,
            `repo: ${repo ?? defaultSelfUpdateRepo}`,
          );
          writeHumanStatus(
            context,
            processOutput,
            `ref:  ${ref ?? defaultSelfUpdateRef}`,
          );
          writeHumanStatus(
            context,
            processOutput,
            `dir:  ${installDir ?? getDefaultSelfUpdateInstallDir()}`,
          );

          try {
            const result = await runSelfUpdate(
              { repo, ref, installDir },
              createSelfUpdateDeps((step) => {
                writeHumanStatus(
                  context,
                  processOutput,
                  `- ${formatStep(step)}`,
                );
              }),
            );
            if (context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: name,
                result,
              });
            } else {
              writeHumanStatus(context, processOutput, pc.green('updated'));
            }
            process.exitCode = 0;
          } catch (error) {
            const cliError = toSelfUpdateCliError(error);
            fail(cliError, { details: { installDir, ref, repo } });
            writeFailure(context, cliError);
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
  args: selfUpdateArgs,
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
            writeHumanStatus(
              context,
              processOutput,
              pc.cyan('CthuTool status'),
            );
            writeHumanStatus(
              context,
              processOutput,
              `version:     ${status.version}`,
            );
            writeHumanStatus(
              context,
              processOutput,
              `install dir: ${status.installDir}`,
            );
            writeHumanStatus(
              context,
              processOutput,
              `repo:        ${status.repo}`,
            );
            writeHumanStatus(
              context,
              processOutput,
              `ref:         ${status.ref}`,
            );
            writeHumanStatus(
              context,
              processOutput,
              `commit:      ${status.commit ?? 'unavailable'}`,
            );
            writeHumanStatus(
              context,
              processOutput,
              `bundle:      ${status.bundlePresent ? 'present' : 'missing'} (${status.bundlePath})`,
            );
          }
          process.exitCode = 0;
        } catch (error) {
          const cliError = toSelfUpdateCliError(error);
          fail(cliError);
          writeFailure(context, cliError);
        }
      },
    );
  },
});

export const updateCommand = createUpdateCommand('update');
export const selfUpdateCommand = createUpdateCommand('self-update');
