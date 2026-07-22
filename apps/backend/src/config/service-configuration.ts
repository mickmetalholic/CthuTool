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
  agentSecret: v.optional(
    v.pipe(v.string(), v.trim(), v.minLength(32), v.maxLength(512)),
  ),
  operatorAccessMode: v.optional(
    v.picklist(['trusted-proxy', 'private-development']),
  ),
  operatorGatewayHeader: v.optional(
    v.pipe(v.string(), v.trim(), v.regex(/^[a-z0-9-]{1,64}$/)),
    'x-cthutool-operator',
  ),
  trustedProxyIps: v.optional(v.string(), ''),
  privateDevelopment: v.optional(v.picklist(['0', '1']), '0'),
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
  readonly agentSecret?: string;
  readonly operatorAccessMode: 'trusted-proxy' | 'private-development';
  readonly operatorGatewayHeader: string;
  readonly trustedProxyIps: readonly string[];
  readonly privateDevelopment: boolean;
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
    agentSecret: env.CTHUTOOL_AGENT_SECRET,
    operatorAccessMode: env.CTHUTOOL_OPERATOR_ACCESS_MODE,
    operatorGatewayHeader: env.CTHUTOOL_OPERATOR_GATEWAY_HEADER,
    trustedProxyIps: env.CTHUTOOL_TRUSTED_PROXY_IPS,
    privateDevelopment: env.CTHUTOOL_PRIVATE_DEVELOPMENT,
  });
  if (!parsed.success) {
    return err(new Error(formatValidationIssues(parsed.issues)));
  }
  const privateDevelopment =
    parsed.output.nodeEnv === 'test' ||
    parsed.output.privateDevelopment === '1';
  const operatorAccessMode =
    parsed.output.operatorAccessMode ??
    (privateDevelopment ? 'private-development' : undefined);
  const trustedProxyIps = parsed.output.trustedProxyIps
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (parsed.output.nodeEnv === 'production' && privateDevelopment) {
    return err(
      new Error('private development access cannot run in production'),
    );
  }
  if (!operatorAccessMode) {
    return err(new Error('operator access boundary must be configured'));
  }
  if (operatorAccessMode === 'trusted-proxy' && trustedProxyIps.length === 0) {
    return err(new Error('trusted proxy mode requires explicit proxy IPs'));
  }
  if (
    operatorAccessMode !== 'private-development' &&
    !parsed.output.agentSecret
  ) {
    return err(new Error('public Agent WebSocket requires an Agent secret'));
  }
  if (
    parsed.output.nodeEnv === 'production' &&
    operatorAccessMode !== 'trusted-proxy'
  ) {
    return err(
      new Error('production requires a trusted operator access proxy'),
    );
  }
  return ok({
    agentSecret: parsed.output.agentSecret,
    environmentId: parsed.output.environmentId,
    logLevel: parsed.output.logLevel,
    nodeEnv: parsed.output.nodeEnv,
    operatorAccessMode,
    operatorGatewayHeader: parsed.output.operatorGatewayHeader,
    port: parsed.output.port,
    privateDevelopment: operatorAccessMode === 'private-development',
    trustedProxyIps,
  });
};
