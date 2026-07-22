import { parseServiceConfiguration } from './service-configuration';

describe('parseServiceConfiguration', () => {
  it('returns valid configuration', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'test',
      LOG_LEVEL: 'debug',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        port: 3000,
        nodeEnv: 'test',
        logLevel: 'debug',
        environmentId: 'local',
        operatorAccessMode: 'private-development',
        operatorGatewayHeader: 'x-cthutool-operator',
        privateDevelopment: true,
        trustedProxyIps: [],
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
      NODE_ENV: 'test',
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.logLevel).toBe('info');
    }
  });

  it('rejects production without trusted proxy and Agent secret', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'production',
    });

    expect(result.isErr()).toBe(true);
  });

  it('accepts a protected public deployment', () => {
    const result = parseServiceConfiguration({
      PORT: '3000',
      NODE_ENV: 'production',
      CTHUTOOL_ENVIRONMENT_ID: 'prod',
      CTHUTOOL_AGENT_SECRET: 'a'.repeat(32),
      CTHUTOOL_OPERATOR_ACCESS_MODE: 'trusted-proxy',
      CTHUTOOL_TRUSTED_PROXY_IPS: '10.0.0.2',
    });

    expect(result.isOk()).toBe(true);
  });
});
