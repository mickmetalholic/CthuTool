import { err, ok } from 'neverthrow';
import type { ServiceConfiguration } from './config/service-configuration';
import { bootstrap } from './main';

describe('bootstrap', () => {
  it('starts app with validated configuration', async () => {
    const enableCors = vi.fn();
    const useGlobalFilters = vi.fn();
    const listen = vi.fn().mockResolvedValue(undefined);
    const app = { enableCors, useGlobalFilters, listen };
    const log = vi.fn();
    const error = vi.fn();
    const startTracing = vi.fn().mockReturnValue({
      enabled: true,
      shutdown: vi.fn(),
    });
    const config: ServiceConfiguration = {
      logLevel: 'info',
      nodeEnv: 'development',
      port: 3000,
    };

    await bootstrap({
      createApp: vi.fn().mockResolvedValue(app),
      parseConfig: vi.fn().mockReturnValue(ok(config)),
      loadEnv: vi.fn(),
      createLogger: vi.fn().mockReturnValue({ log, error }),
      startTracing,
      exit: vi.fn(),
    });

    expect(enableCors).toHaveBeenCalledWith({ origin: true });
    expect(useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(3000);
    expect(log).toHaveBeenCalledWith(
      'service started',
      expect.objectContaining({
        service: 'backend',
        tracingEnabled: true,
        nodeEnv: 'development',
        port: 3000,
      }),
    );
    expect(startTracing).toHaveBeenCalledWith(process.env);
  });

  it('logs and exits when configuration is invalid', async () => {
    const createApp = vi.fn();
    const log = vi.fn();
    const error = vi.fn();
    const exit = vi.fn();

    await bootstrap({
      createApp,
      parseConfig: vi.fn().mockReturnValue(err(new Error('invalid config'))),
      loadEnv: vi.fn(),
      createLogger: vi.fn().mockReturnValue({ log, error }),
      exit,
    });

    expect(error).toHaveBeenCalledWith(
      'configuration validation failed',
      expect.objectContaining({
        code: 'CONFIG_INVALID',
        details: 'invalid config',
      }),
    );
    expect(exit).toHaveBeenCalledWith(1);
    expect(createApp).not.toHaveBeenCalled();
  });
});
