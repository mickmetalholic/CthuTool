import { confirm, isCancel } from '@clack/prompts';
import { defineCommand } from 'citty';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import {
  runBrowserAuthLogin,
  runBrowserAuthVerify,
  type BrowserAuthLoginInput,
  type BrowserAuthLoginResult,
  type BrowserAuthVerifyInput,
  type BrowserAuthVerifyResult,
} from '../domain/browser-auth-helper';
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
  readonly installBrowsers: (input: BrowserInstallInput) => Promise<void>;
  readonly runLogin: (
    input: BrowserAuthLoginInput,
  ) => Promise<BrowserAuthLoginResult>;
  readonly runVerify: (
    input: BrowserAuthVerifyInput,
  ) => Promise<BrowserAuthVerifyResult>;
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

const profileDefaults: Record<
  string,
  {
    readonly allowedOrigins: readonly string[];
    readonly loginUrl: string;
    readonly userVerifyUrl?: string;
    readonly verifyUrl: string;
  }
> = {
  douban: {
    allowedOrigins: [
      'https://accounts.douban.com',
      'https://movie.douban.com',
      'https://www.douban.com',
    ],
    loginUrl: 'https://accounts.douban.com/passport/login',
    userVerifyUrl: 'https://www.douban.com/mine/',
    verifyUrl: 'https://movie.douban.com/',
  },
};

const defaultDeps: BrowserCommandDeps = {
  checkBrowsers: async () => checkBrowserRuntime(),
  installBrowsers: async (input) => installPlaywrightBrowsers(input),
  runLogin: async (input) =>
    runBrowserAuthLogin(input, {
      launchBrowser: async () => {
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({ headless: false });
        return { browser };
      },
      waitForUser: async () => {
        const result = await confirm({
          message: 'Complete login in the browser, then confirm here.',
        });
        if (isCancel(result) || result !== true) {
          throw createCliError('invalid_option', 'browser auth login cancelled');
        }
      },
    }),
  runVerify: async (input) =>
    runBrowserAuthVerify(input, {
      launchBrowser: async (verifyInput) => {
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({
          headless: verifyInput.headed !== true,
        });
        const context = await browser.newContext({
          storageState: verifyInput.storageStatePath,
        });
        const page = await context.newPage();
        return { browser, page };
      },
    }),
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

const loginArgs = {
  ...cliContractArgs,
  profile: {
    type: 'positional',
    description: 'Browser auth profile name, such as douban',
    required: false,
  },
  out: {
    type: 'string',
    description: 'Output root for browser auth bundles',
  },
  loginUrl: {
    type: 'string',
    description: 'Login URL to open when no profile default exists',
  },
  verifyUrl: {
    type: 'string',
    description: 'Optional URL used later to verify the profile',
  },
  allowedOrigin: {
    type: 'string',
    description: 'Comma-separated list of allowed origins for the profile',
  },
} as const;

const verifyArgs = {
  ...cliContractArgs,
  profile: {
    type: 'positional',
    description: 'Browser auth profile name, such as douban',
    required: false,
  },
  headed: {
    type: 'boolean',
    description: 'Show the browser while verifying auth',
  },
  out: {
    type: 'string',
    description: 'Output root that contains browser auth bundles',
  },
  verifyUrl: {
    type: 'string',
    description: 'Optional URL used to verify the profile',
  },
} as const;

type InstallArgs = {
  readonly browser?: unknown;
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly quiet?: unknown;
  readonly withDeps?: unknown;
};

type LoginArgs = {
  readonly allowedOrigin?: unknown;
  readonly json?: unknown;
  readonly loginUrl?: unknown;
  readonly noInteractive?: unknown;
  readonly out?: unknown;
  readonly profile?: unknown;
  readonly quiet?: unknown;
  readonly verifyUrl?: unknown;
};

type VerifyArgs = {
  readonly headed?: unknown;
  readonly json?: unknown;
  readonly noInteractive?: unknown;
  readonly out?: unknown;
  readonly profile?: unknown;
  readonly quiet?: unknown;
  readonly verifyUrl?: unknown;
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
      auth: defineCommand({
        meta: {
          name: 'auth',
          description: 'Browser auth profile helpers',
        },
        subCommands: {
          login: defineCommand({
            meta: {
              name: 'login',
              description:
                'Open a headed browser for manual login and export auth state',
            },
            args: loginArgs,
            async run({ args }) {
              const context = createCliContext(args);
              const input = resolveLoginInput(args);
              if (input instanceof Error) {
                const error = createCliError('invalid_option', input.message);
                writeCommandError(context, processOutput, error);
                process.exitCode = error.exitCode;
                return;
              }

              try {
                const result = await commandDeps.runLogin(input);
                if (context.json) {
                  writeJsonValue(processOutput, {
                    ok: true,
                    command: 'browser auth login',
                    result,
                  });
                } else {
                  writeHumanStatus(
                    context,
                    processOutput,
                    `Browser auth profile written: ${result.profilePath}`,
                  );
                }
                process.exitCode = 0;
              } catch (error) {
                const commandError =
                  error instanceof Error
                    ? createCliError('script_execution_failed', error.message)
                    : createCliError(
                        'script_execution_failed',
                        'browser auth login failed',
                      );
                writeCommandError(context, processOutput, commandError);
                process.exitCode = commandError.exitCode;
              }
            },
          }),
          verify: defineCommand({
            meta: {
              name: 'verify',
              description: 'Verify a stored browser auth profile',
            },
            args: verifyArgs,
            async run({ args }) {
              const context = createCliContext(args);
              const input = resolveVerifyInput(args);
              if (input instanceof Error) {
                const error = createCliError('invalid_option', input.message);
                writeCommandError(context, processOutput, error);
                process.exitCode = error.exitCode;
                return;
              }

              try {
                const result = await commandDeps.runVerify(input);
                if (context.json) {
                  writeJsonValue(processOutput, {
                    ok: true,
                    command: 'browser auth verify',
                    result,
                  });
                } else {
                  writeHumanStatus(
                    context,
                    processOutput,
                    `${result.user.nickname} (${result.user.id})`,
                  );
                }
                process.exitCode = 0;
              } catch (error) {
                const commandError =
                  error instanceof Error
                    ? createCliError('script_execution_failed', error.message)
                    : createCliError(
                        'script_execution_failed',
                        'browser auth verify failed',
                      );
                writeCommandError(context, processOutput, commandError);
                process.exitCode = commandError.exitCode;
              }
            },
          }),
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

function resolveLoginInput(args: LoginArgs): BrowserAuthLoginInput | Error {
  const profileName = getStringArg(args.profile);
  if (!profileName) {
    return new Error('profile is required');
  }

  const defaults = profileDefaults[profileName];
  const loginUrl = getStringArg(args.loginUrl) ?? defaults?.loginUrl;
  if (!loginUrl) {
    return new Error(
      'login URL is required for profiles without a built-in default',
    );
  }

  const outputRoot =
    getStringArg(args.out) ?? './data/secrets/browser-auth';
  return {
    allowedOrigins:
      parseAllowedOrigins(args.allowedOrigin) ?? defaults?.allowedOrigins,
    loginUrl,
    outputRoot,
    profileName,
    verifyUrl: getStringArg(args.verifyUrl) ?? defaults?.verifyUrl,
  };
}

function resolveVerifyInput(args: VerifyArgs): BrowserAuthVerifyInput | Error {
  const profileName = getStringArg(args.profile);
  if (!profileName) {
    return new Error('profile is required');
  }
  const defaults = profileDefaults[profileName];
  return {
    authRoot: getStringArg(args.out) ?? './data/secrets/browser-auth',
    headed: args.headed === true,
    profileName,
    verifyUrl:
      getStringArg(args.verifyUrl) ??
      defaults?.userVerifyUrl ??
      defaults?.verifyUrl,
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
      error: error instanceof Error ? error.message : 'failed to load Playwright',
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
      reject(new Error(`playwright install exited with code ${code ?? 'null'}`));
    });
  });
}

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function parseAllowedOrigins(value: unknown): string[] | undefined {
  const raw = getStringArg(value);
  if (!raw) {
    return undefined;
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export const browserCommand = createBrowserCommand();
