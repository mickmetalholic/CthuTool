import { parseServiceConfiguration } from './service-configuration';

describe('parseServiceConfiguration', () => {
  it('returns valid configuration', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        port: 3000,
        nodeEnv: 'development',
        logLevel: 'debug',
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
    }
  });
});
