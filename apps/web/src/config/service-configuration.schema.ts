import { err, ok, type Result } from 'neverthrow';
import * as v from 'valibot';

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
>;

/**
 * Parse environment variables into service configuration.
 * @param env Raw process environment variables.
 * @returns Result with validated service configuration or validation error.
 */
export const parseServiceConfiguration = (
  env: NodeJS.ProcessEnv,
): Result<ServiceConfiguration, Error> => {
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
  return ok(parsed.output);
};
