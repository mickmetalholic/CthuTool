import { resolveTraceEndpoint, startBackendTracing } from './tracing';

describe('backend tracing bootstrap', () => {
  it('stays disabled when no OTLP endpoint is configured', () => {
    const deps = createDeps();

    const tracing = startBackendTracing({ NODE_ENV: 'test' }, deps);

    expect(tracing.enabled).toBe(false);
    expect(deps.createExporter).not.toHaveBeenCalled();
    expect(deps.createSdk).not.toHaveBeenCalled();
  });

  it('stays disabled when OTEL_SDK_DISABLED is true', () => {
    const deps = createDeps();

    const tracing = startBackendTracing(
      {
        NODE_ENV: 'test',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector:4318',
        OTEL_SDK_DISABLED: 'true',
      },
      deps,
    );

    expect(tracing.enabled).toBe(false);
    expect(deps.createSdk).not.toHaveBeenCalled();
  });

  it('starts the SDK when OTLP export is configured', async () => {
    const deps = createDeps();

    const tracing = startBackendTracing(
      {
        NODE_ENV: 'production',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector:4318',
      },
      deps,
    );

    expect(tracing.enabled).toBe(true);
    expect(deps.createExporter).toHaveBeenCalledWith(
      'http://collector:4318/v1/traces',
    );
    expect(deps.createSdk).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'production',
        exporter: exporter,
        serviceName: 'cthutool-backend',
      }),
    );
    expect(sdk.start).toHaveBeenCalledTimes(1);

    await tracing.shutdown();
    expect(sdk.shutdown).toHaveBeenCalledTimes(1);
  });

  it('prefers the traces endpoint when both OTLP endpoints are configured', () => {
    expect(
      resolveTraceEndpoint({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector:4318',
        OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: 'http://collector:4318/custom',
      }),
    ).toBe('http://collector:4318/custom');
  });
});

const exporter = {};
const sdk = {
  shutdown: vi.fn(async () => undefined),
  start: vi.fn(),
};

function createDeps() {
  sdk.shutdown.mockClear();
  sdk.start.mockClear();
  return {
    createExporter: vi.fn(() => exporter as never),
    createSdk: vi.fn(() => sdk),
  };
}
