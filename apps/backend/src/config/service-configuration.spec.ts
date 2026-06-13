import { parseServiceConfiguration } from './service-configuration';

describe('parseServiceConfiguration', () => {
  it('returns valid configuration', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
      BROWSER_PROVIDER: 'local-playwright',
      BROWSER_HEADLESS: 'false',
      BROWSER_DATA_DIR: './tmp/browser',
      BROWSER_AUTH_STATE_DIR: './tmp/auth',
      BROWSER_DIAGNOSTICS_DIR: './tmp/diagnostics',
      BROWSER_SITES_CONFIG_FILE: './tmp/browser-sites.json',
      BROWSER_MAX_CONCURRENCY: '2',
      BROWSER_DEFAULT_TIMEOUT_MS: '45000',
      BROWSER_DEFAULT_DELAY_MS: '250',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        port: 3000,
        nodeEnv: 'development',
        logLevel: 'debug',
        browser: {
          provider: 'local-playwright',
          headless: false,
          dataDir: './tmp/browser',
          authStateDir: './tmp/auth',
          diagnosticsDir: './tmp/diagnostics',
          sitesConfigFile: './tmp/browser-sites.json',
          maxConcurrency: 2,
          defaultTimeoutMs: 45000,
          defaultDelayMs: 250,
        },
      });
    }
  });

  it('fails when required values are missing', () => {
    const result = parseServiceConfiguration({});
    expect(result.isErr()).toBe(true);
  });

  it('fails when port is out of range', () => {
    const result = parseServiceConfiguration({
      PORT: '70000',
      NODE_ENV: 'development',
    });

    expect(result.isErr()).toBe(true);
  });

  it('fails when nodeEnv is invalid', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'staging',
    });

    expect(result.isErr()).toBe(true);
  });

  it('uses default log level when LOG_LEVEL is missing', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'production',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.logLevel).toBe('info');
      expect(result.value.browser).toEqual({
        provider: 'local-playwright',
        headless: true,
        dataDir: './data/browser',
        authStateDir: './data/secrets/browser-auth',
        diagnosticsDir: './data/browser-diagnostics',
        maxConcurrency: 1,
        defaultTimeoutMs: 30000,
        defaultDelayMs: 1000,
      });
    }
  });

  it('fails when browser provider is invalid', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'development',
      BROWSER_PROVIDER: 'steel',
    });

    expect(result.isErr()).toBe(true);
  });

  it('fails when browser max concurrency is invalid', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'development',
      BROWSER_MAX_CONCURRENCY: '0',
    });

    expect(result.isErr()).toBe(true);
  });
});
