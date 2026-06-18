import { defineCommand } from 'citty';
import pc from 'picocolors';
import {
  createSelfUpdateDeps,
  defaultSelfUpdateRef,
  defaultSelfUpdateRepo,
  getDefaultSelfUpdateInstallDir,
  runSelfUpdate,
  SelfUpdateError,
  type SelfUpdateStep,
} from '../domain/self-update-manager';
import { cliContractArgs, createCliContext } from '../runtime/cli-context';
import { createCliError } from '../runtime/cli-error';
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

type SelfUpdateCommandArgs = {
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
  readonly repo?: unknown;
  readonly ref?: unknown;
  readonly 'install-dir'?: unknown;
};

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
    case 'install-dependencies':
      return 'installing dependencies';
    case 'build':
      return 'building CLI';
    case 'install-global':
      return 'installing global command';
  }
}

function writeFailure(args: SelfUpdateCommandArgs, error: unknown): void {
  const context = createCliContext(args);
  const cliError =
    error instanceof SelfUpdateError
      ? createCliError('self_update_failed', error.message)
      : createCliError(
          'self_update_failed',
          error instanceof Error ? error.message : 'self-update failed',
        );
  writeCommandError(context, processOutput, cliError);
  process.exitCode = cliError.exitCode;
}

export const selfUpdateCommand = defineCommand({
  meta: {
    name: 'self-update',
    description:
      'Update the global chc command from the CthuTool Git repository.',
  },
  args: selfUpdateArgs,
  async run({ args }) {
    const context = createCliContext(args);
    const repo = getStringArg(args.repo);
    const ref = getStringArg(args.ref);
    const installDir = getStringArg(args['install-dir']);

    writeHumanStatus(context, processOutput, pc.cyan('CthuTool self-update'));
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
          writeHumanStatus(context, processOutput, `- ${formatStep(step)}`);
        }),
      );
      if (context.json) {
        writeJsonValue(processOutput, {
          ok: true,
          command: 'self-update',
          result,
        });
      } else {
        writeHumanStatus(context, processOutput, pc.green('updated'));
      }
      process.exitCode = 0;
    } catch (error) {
      writeFailure(args, error);
    }
  },
});
