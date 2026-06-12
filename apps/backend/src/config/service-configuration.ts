import { err, ok, type Result } from 'neverthrow';
import * as v from 'valibot';

const BROWSER_CONFIGURATION_SCHEMA = v.object({
  provider: v.optional(v.picklist(['local-playwright']), 'local-playwright'),
  headless: v.pipe(
    v.string(),
    v.transform((input) => input !== 'false'),
    v.boolean(),
  ),
  dataDir: v.optional(v.string(), './data/browser'),
  authStateDir: v.optional(v.string(), './data/secrets/browser-auth'),
  diagnosticsDir: v.optional(v.string(), './data/browser-diagnostics'),
  maxConcurrency: v.pipe(
    v.string(),
    v.transform((input) => Number(input)),
    v.number(),
    v.integer(),
    v.minValue(1),
  ),
  defaultTimeoutMs: v.pipe(
    v.string(),
    v.transform((input) => Number(input)),
    v.number(),
    v.integer(),
    v.minValue(1),
  ),
  defaultDelayMs: v.pipe(
    v.string(),
    v.transform((input) => Number(input)),
    v.number(),
    v.integer(),
    v.minValue(0),
  ),
});

const SERVICE_CONFIGURATION_SCHEMA = v.object({
  port: v.pipe(
    v.string(),
    v.transform((input) => Number(input)),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(65535),
  ),
  nodeEnv: v.picklist(['development', 'test', 'production']),
  logLevel: v.optional(v.picklist(['debug', 'info', 'warn', 'error']), 'info'),
});

export type ServiceConfiguration = v.InferOutput<
  typeof SERVICE_CONFIGURATION_SCHEMA
> & {
  readonly browser: BrowserConfiguration;
};

export type BrowserConfiguration = v.InferOutput<
  typeof BROWSER_CONFIGURATION_SCHEMA
>;

export const parseBrowserConfiguration = (
  env: NodeJS.ProcessEnv,
): Result<BrowserConfiguration, Error> => {
  const parsed = v.safeParse(BROWSER_CONFIGURATION_SCHEMA, {
    provider: env.BROWSER_PROVIDER,
    headless: env.BROWSER_HEADLESS ?? 'true',
    dataDir: env.BROWSER_DATA_DIR,
    authStateDir: env.BROWSER_AUTH_STATE_DIR,
    diagnosticsDir: env.BROWSER_DIAGNOSTICS_DIR,
    maxConcurrency: env.BROWSER_MAX_CONCURRENCY ?? '1',
    defaultTimeoutMs: env.BROWSER_DEFAULT_TIMEOUT_MS ?? '30000',
    defaultDelayMs: env.BROWSER_DEFAULT_DELAY_MS ?? '1000',
  });
  if (!parsed.success) {
    return err(
      new Error(
        v.flatten(parsed.issues).nested?.toString() ?? 'Invalid configuration',
      ),
    );
  }
  return ok(parsed.output);
};

/**
 * Parse environment variables into service configuration.
 * @param env Raw process environment variables.
 * @returns Result with validated service configuration or validation error.
 */
export const parseServiceConfiguration = (
  env: NodeJS.ProcessEnv,
): Result<ServiceConfiguration, Error> => {
  const browser = parseBrowserConfiguration(env);
  if (browser.isErr()) {
    return err(browser.error);
  }

  const parsed = v.safeParse(SERVICE_CONFIGURATION_SCHEMA, {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
  });
  if (!parsed.success) {
    return err(
      new Error(
        v.flatten(parsed.issues).nested?.toString() ?? 'Invalid configuration',
      ),
    );
  }
  return ok({ ...parsed.output, browser: browser.value });
};
