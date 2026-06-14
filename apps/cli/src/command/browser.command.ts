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
};

export type BrowserDoctorResult = {
  readonly hostChromeAvailable: boolean;
  readonly hostChromeError?: string;
  readonly ok: boolean;
  readonly playwrightAvailable: boolean;
  readonly preferredRuntime: 'host-chrome';
  readonly warnings: readonly string[];
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
      description: 'Browser runtime and automation helpers',
    },
    subCommands: {
      doctor: defineCommand({
        meta: {
          name: 'doctor',
          description: 'Check local browser runtime availability',
        },
        args: doctorArgs,
        async run({ args }) {
          const context = createCliContext(args);
          const result = await commandDeps.checkBrowsers();
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: result.ok,
              command: 'browser doctor',
              result,
            });
          } else {
            writeHumanStatus(
              context,
              processOutput,
              `Browser runtime: ${result.ok ? 'ready' : 'incomplete'}`,
            );
            writeHumanStatus(
              context,
              processOutput,
              `Preferred runtime: ${result.preferredRuntime} (${availableText(
                result.hostChromeAvailable,
              )})`,
            );
            for (const warning of result.warnings) {
              writeHumanStatus(context, processOutput, `Warning: ${warning}`);
            }
          }
          process.exitCode = result.ok ? 0 : 1;
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
    const hostChrome = await canLaunchHostChrome(chromium);
    return createDoctorResult({
      hostChrome,
      playwrightAvailable: true,
    });
  } catch (error) {
    return createDoctorResult({
      hostChrome: {
        available: false,
        error: 'Playwright is not available to check host Chrome',
      },
      playwrightAvailable: false,
    });
  }
}

function createDoctorResult(input: {
  readonly hostChrome: RuntimeAvailability;
  readonly playwrightAvailable: boolean;
}): BrowserDoctorResult {
  const warnings: string[] = [];
  if (!input.playwrightAvailable) {
    warnings.push(
      'Playwright is not available; desktop cannot automate Chrome.',
    );
  }
  if (!input.hostChrome.available) {
    warnings.push(
      'Host Google Chrome is unavailable; install Google Chrome or configure an executable path.',
    );
  }

  return {
    hostChromeAvailable: input.hostChrome.available,
    ...(input.hostChrome.error
      ? { hostChromeError: input.hostChrome.error }
      : {}),
    ok: input.playwrightAvailable && input.hostChrome.available,
    playwrightAvailable: input.playwrightAvailable,
    preferredRuntime: 'host-chrome',
    warnings,
  };
}

type RuntimeAvailability = {
  readonly available: boolean;
  readonly error?: string;
};

type PlaywrightChromium = {
  readonly launch: (options: {
    readonly channel?: string;
    readonly headless: boolean;
  }) => Promise<{ readonly close: () => Promise<void> }>;
};

async function canLaunchHostChrome(
  chromium: PlaywrightChromium,
): Promise<RuntimeAvailability> {
  let browser: { readonly close: () => Promise<void> } | undefined;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    return { available: true };
  } catch (error) {
    return {
      available: false,
      error:
        error instanceof Error ? error.message : 'host Chrome launch failed',
    };
  } finally {
    await browser?.close();
  }
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

function availableText(available: boolean): string {
  return available ? 'available' : 'unavailable';
}

function getStringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export const browserCommand = createBrowserCommand();
