import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineCommand } from 'citty';
import { cliContractArgs, createCliContext } from '../runtime/cli-context';
import { createCliError } from '../runtime/cli-error';
import {
  processOutput,
  writeCommandError,
  writeHumanStatus,
  writeJsonValue,
} from '../runtime/output';

export type BrowserCommandDeps = {
  readonly checkBrowsers: () => Promise<BrowserDoctorResult>;
  readonly fetchBrowserStatus: (
    input: BrowserStatusInput,
  ) => Promise<BrowserStatusResult>;
  readonly installBrowsers: (input: BrowserInstallInput) => Promise<void>;
};

export type BrowserInstallInput = {
  readonly browserName: 'chromium';
  readonly withDeps: boolean;
};

export type BrowserDoctorResult = {
  readonly chromiumAvailable: boolean;
  readonly installCommand: string;
  readonly playwrightAvailable: boolean;
  readonly error?: string;
};

export type BrowserStatusInput = {
  readonly backendUrl: string;
};

export type BrowserStatusResult = {
  readonly pendingAuthTasks: unknown[];
  readonly profiles: unknown[];
  readonly sites: unknown[];
};

const defaultDeps: BrowserCommandDeps = {
  checkBrowsers: async () => checkBrowserRuntime(),
  fetchBrowserStatus: async (input) => fetchBrowserStatus(input),
  installBrowsers: async (input) => installPlaywrightBrowsers(input),
};

const installArgs = {
  ...cliContractArgs,
  browser: {
    type: 'positional',
    description: 'Browser to install. Defaults to chromium.',
    required: false,
  },
  withDeps: {
    type: 'boolean',
    description: 'Ask Playwright to install operating system dependencies too',
  },
} as const;

const doctorArgs = {
  ...cliContractArgs,
} as const;

const statusArgs = {
  ...cliContractArgs,
  backendUrl: {
    type: 'string',
    description:
      'Backend base URL. Defaults to CTHUTOOL_BACKEND_URL or localhost.',
  },
} as const;

type InstallArgs = {
  readonly browser?: unknown;
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
  readonly withDeps?: unknown;
};

type StatusArgs = {
  readonly backendUrl?: unknown;
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
};

export const createBrowserCommand = (
  deps: Partial<BrowserCommandDeps> = {},
) => {
  const commandDeps: BrowserCommandDeps = {
    ...defaultDeps,
    ...deps,
  };

  return defineCommand({
    meta: {
      name: 'browser',
      description: 'Browser automation helpers',
    },
    subCommands: {
      install: defineCommand({
        meta: {
          name: 'install',
          description: 'Install browser binaries required by browser helpers',
        },
        args: installArgs,
        async run({ args }) {
          const context = createCliContext(args);
          const input = resolveInstallInput(args);
          if (input instanceof Error) {
            const error = createCliError('invalid_option', input.message);
            writeCommandError(context, processOutput, error);
            process.exitCode = error.exitCode;
            return;
          }

          try {
            await commandDeps.installBrowsers(input);
            if (context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: 'browser install',
                result: input,
              });
            } else {
              writeHumanStatus(
                context,
                processOutput,
                `Installed browser runtime: ${input.browserName}`,
              );
            }
            process.exitCode = 0;
          } catch (error) {
            const commandError =
              error instanceof Error
                ? createCliError('script_execution_failed', error.message)
                : createCliError(
                    'script_execution_failed',
                    'browser install failed',
                  );
            writeCommandError(context, processOutput, commandError);
            process.exitCode = commandError.exitCode;
          }
        },
      }),
      doctor: defineCommand({
        meta: {
          name: 'doctor',
          description: 'Check browser helper runtime dependencies',
        },
        args: doctorArgs,
        async run({ args }) {
          const context = createCliContext(args);
          const result = await commandDeps.checkBrowsers();
          const ok = result.playwrightAvailable && result.chromiumAvailable;
          if (context.json) {
            writeJsonValue(processOutput, {
              ok,
              command: 'browser doctor',
              result,
            });
          } else if (ok) {
            writeHumanStatus(
              context,
              processOutput,
              'Browser runtime is ready.',
            );
          } else {
            writeCommandError(
              context,
              processOutput,
              createCliError(
                'script_execution_failed',
                `Browser runtime is not ready. Run: ${result.installCommand}`,
              ),
            );
          }
          process.exitCode = ok ? 0 : 1;
        },
      }),
      status: defineCommand({
        meta: {
          name: 'status',
          description:
            'Show backend browser sites, profile summaries, and pending auth tasks',
        },
        args: statusArgs,
        async run({ args }) {
          const context = createCliContext(args);
          const input = resolveStatusInput(args);
          try {
            const result = await commandDeps.fetchBrowserStatus(input);
            if (context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: 'browser status',
                result,
              });
            } else {
              writeHumanStatus(
                context,
                processOutput,
                `Browser sites: ${result.sites.length}, profiles: ${result.profiles.length}, pending auth tasks: ${result.pendingAuthTasks.length}`,
              );
            }
            process.exitCode = 0;
          } catch (error) {
            const commandError =
              error instanceof Error
                ? createCliError('script_execution_failed', error.message)
                : createCliError(
                    'script_execution_failed',
                    'browser status failed',
                  );
            writeCommandError(context, processOutput, commandError);
            process.exitCode = commandError.exitCode;
          }
        },
      }),
    },
  });
};

function resolveInstallInput(args: InstallArgs): BrowserInstallInput | Error {
  const browserName = getStringArg(args.browser) ?? 'chromium';
  if (browserName !== 'chromium') {
    return new Error('only chromium is supported');
  }
  return {
    browserName,
    withDeps: args.withDeps === true,
  };
}

function resolveStatusInput(args: StatusArgs): BrowserStatusInput {
  return {
    backendUrl:
      getStringArg(args.backendUrl) ??
      process.env.CTHUTOOL_BACKEND_URL ??
      'http://localhost:3000',
  };
}

async function checkBrowserRuntime(): Promise<BrowserDoctorResult> {
  try {
    const { chromium } = await import('playwright');
    const executablePath = chromium.executablePath();
    return {
      chromiumAvailable: existsSync(executablePath),
      installCommand: 'chc browser install',
      playwrightAvailable: true,
    };
  } catch (error) {
    return {
      chromiumAvailable: false,
      error:
        error instanceof Error ? error.message : 'failed to load Playwright',
      installCommand: 'chc browser install',
      playwrightAvailable: false,
    };
  }
}

async function installPlaywrightBrowsers(
  input: BrowserInstallInput,
): Promise<void> {
  const require = createRequire(import.meta.url);
  const playwrightPackageJson = require.resolve('playwright/package.json');
  const cliPath = join(dirname(playwrightPackageJson), 'cli.js');
  const args = [cliPath, 'install'];
  if (input.withDeps) {
    args.push('--with-deps');
  }
  args.push(input.browserName);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`playwright install exited with code ${code ?? 'null'}`),
      );
    });
  });
}

async function fetchBrowserStatus(
  input: BrowserStatusInput,
): Promise<BrowserStatusResult> {
  const baseUrl = input.backendUrl.replace(/\/+$/, '');
  const [sites, profiles, pendingAuthTasks] = await Promise.all([
    fetchJson(`${baseUrl}/api/browser/sites`, 'sites'),
    fetchJson(`${baseUrl}/api/browser/profiles`, 'profiles'),
    fetchJson(`${baseUrl}/api/browser/pending-auth-tasks`, 'tasks'),
  ]);
  return {
    pendingAuthTasks,
    profiles,
    sites,
  };
}

async function fetchJson(url: string, key: string): Promise<unknown[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}`);
  }
  const body = (await response.json()) as Record<string, unknown>;
  const value = body[key];
  if (!Array.isArray(value)) {
    throw new Error(`GET ${url} did not return an array field "${key}"`);
  }
  return value;
}

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export const browserCommand = createBrowserCommand();
