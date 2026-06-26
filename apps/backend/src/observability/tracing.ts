import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
} from '@opentelemetry/semantic-conventions';

export type BackendTracingHandle = {
  readonly enabled: boolean;
  readonly shutdown: () => Promise<void>;
};

type TracingDeps = {
  readonly createExporter: (url?: string) => OTLPTraceExporter;
  readonly createSdk: (input: {
    readonly exporter: OTLPTraceExporter;
    readonly environment: string;
    readonly serviceName: string;
  }) => Pick<NodeSDK, 'shutdown' | 'start'>;
};

const disabledTracing: BackendTracingHandle = {
  enabled: false,
  shutdown: async () => undefined,
};

const defaultTracingDeps: TracingDeps = {
  createExporter: (url) => new OTLPTraceExporter(url ? { url } : undefined),
  createSdk: ({ environment, exporter, serviceName }) =>
    new NodeSDK({
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
      resource: resourceFromAttributes({
        [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: environment,
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_NAMESPACE]: 'cthutool',
      }),
      traceExporter: exporter,
    }),
};

export function startBackendTracing(
  env: NodeJS.ProcessEnv = process.env,
  deps: TracingDeps = defaultTracingDeps,
): BackendTracingHandle {
  if (env.OTEL_SDK_DISABLED === 'true') {
    return disabledTracing;
  }

  const endpoint = resolveTraceEndpoint(env);
  if (!endpoint) {
    return disabledTracing;
  }

  const serviceName = env.OTEL_SERVICE_NAME || 'cthutool-backend';
  const environment = env.NODE_ENV || 'development';
  const sdk = deps.createSdk({
    environment,
    exporter: deps.createExporter(endpoint),
    serviceName,
  });

  sdk.start();

  return {
    enabled: true,
    shutdown: () => sdk.shutdown(),
  };
}

export function resolveTraceEndpoint(
  env: NodeJS.ProcessEnv,
): string | undefined {
  if (env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    return env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  }
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return undefined;
  }
  return new URL('/v1/traces', env.OTEL_EXPORTER_OTLP_ENDPOINT).toString();
}
