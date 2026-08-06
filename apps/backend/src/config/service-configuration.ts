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
  environmentId: v.optional(
    v.pipe(v.string(), v.trim(), v.regex(/^[a-z][a-z0-9-]{0,63}$/)),
    'local',
  ),
});

const formatValidationIssues = (issues: readonly v.BaseIssue<unknown>[]) => {
  return issues
    .map((issue) => {
      const path = issue.path
        ?.map((item) => item.key)
        .filter((key): key is string | number => key !== undefined)
        .join('.');
      return `${path || 'configuration'}: ${issue.message}`;
    })
    .join('; ');
};

export type ServiceConfiguration = {
  readonly port: number;
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly environmentId: string;
};

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
    environmentId: env.CTHUTOOL_ENVIRONMENT_ID,
  });
  if (!parsed.success) {
    return err(new Error(formatValidationIssues(parsed.issues)));
  }
  return ok({
    environmentId: parsed.output.environmentId,
    logLevel: parsed.output.logLevel,
    nodeEnv: parsed.output.nodeEnv,
    port: parsed.output.port,
  });
};
