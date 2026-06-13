import { err, ok } from 'neverthrow';
import type { ServiceConfiguration } from './config/service-configuration';
import { bootstrap } from './main';

describe('bootstrap', () => {
  it('starts app with validated configuration', async () => {
    const enableCors = jest.fn();
    const useGlobalFilters = jest.fn();
    const listen = jest.fn().mockResolvedValue(undefined);
    const app = { enableCors, useGlobalFilters, listen };
    const log = jest.fn();
    const error = jest.fn();
    const config: ServiceConfiguration = {
      browser: {
        authStateDir: './data/secrets/browser-auth',
        dataDir: './data/browser',
        defaultDelayMs: 1000,
        defaultTimeoutMs: 30000,
        diagnosticsDir: './data/browser-diagnostics',
        headless: true,
        maxConcurrency: 1,
        provider: 'local-playwright',
      },
      logLevel: 'info',
      nodeEnv: 'development',
      port: 3000,
    };

    await bootstrap({
      createApp: jest.fn().mockResolvedValue(app),
      parseConfig: jest.fn().mockReturnValue(ok(config)),
      loadEnv: jest.fn(),
      createLogger: jest.fn().mockReturnValue({ log, error }),
      exit: jest.fn(),
    });

    expect(enableCors).toHaveBeenCalledWith({ origin: true });
    expect(useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(3000);
    expect(log).toHaveBeenCalledWith(
      'service started',
      expect.objectContaining({
        service: 'backend',
        nodeEnv: 'development',
        port: 3000,
      }),
    );
  });

  it('logs and exits when configuration is invalid', async () => {
    const createApp = jest.fn();
    const log = jest.fn();
    const error = jest.fn();
    const exit = jest.fn();

    await bootstrap({
      createApp,
      parseConfig: jest.fn().mockReturnValue(err(new Error('invalid config'))),
      loadEnv: jest.fn(),
      createLogger: jest.fn().mockReturnValue({ log, error }),
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
