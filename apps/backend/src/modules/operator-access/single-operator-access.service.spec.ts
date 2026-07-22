import { UnauthorizedException } from '@nestjs/common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  readOperatorAccessConfiguration,
  SingleOperatorAccessService,
} from './single-operator-access.service';

describe('single operator and Agent access boundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('rejects anonymous production configuration', () => {
    expect(() =>
      readOperatorAccessConfiguration({ NODE_ENV: 'production' }),
    ).toThrow(/boundary/);
    expect(() =>
      readOperatorAccessConfiguration({
        NODE_ENV: 'production',
        CTHUTOOL_PRIVATE_DEVELOPMENT: '1',
      }),
    ).toThrow(/cannot run in production/);
  });

  test('accepts identity only from an explicitly trusted proxy address', () => {
    stubProtectedEnvironment();
    const access = new SingleOperatorAccessService();
    expect(() =>
      access.assertOperator(
        request('10.0.0.2', { 'x-cthutool-operator': 'owner@example.com' }),
      ),
    ).not.toThrow();
    expect(() =>
      access.assertOperator(
        request('203.0.113.10', {
          'x-cthutool-operator': 'spoofed@example.com',
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  test('authenticates the environment Agent secret without returning values', () => {
    stubProtectedEnvironment();
    const access = new SingleOperatorAccessService();
    const valid = access.authenticateAgent(
      request('10.0.0.2', {
        authorization: `Agent ${'s'.repeat(32)}`,
        'x-cthutool-environment-id': 'prod',
      }),
    );
    const invalid = access.authenticateAgent(
      request('10.0.0.2', {
        authorization: `Agent ${'x'.repeat(32)}`,
        'x-cthutool-environment-id': 'prod',
      }),
    );

    expect(valid).toEqual({ ok: true, environmentId: 'prod' });
    expect(invalid).toEqual({
      ok: false,
      category: 'agent_secret_invalid',
    });
    expect(JSON.stringify(invalid)).not.toContain('x'.repeat(32));
  });
});

function stubProtectedEnvironment(): void {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('CTHUTOOL_ENVIRONMENT_ID', 'prod');
  vi.stubEnv('CTHUTOOL_AGENT_SECRET', 's'.repeat(32));
  vi.stubEnv('CTHUTOOL_OPERATOR_ACCESS_MODE', 'trusted-proxy');
  vi.stubEnv('CTHUTOOL_TRUSTED_PROXY_IPS', '10.0.0.2');
  vi.stubEnv('CTHUTOOL_PRIVATE_DEVELOPMENT', '0');
}

function request(
  remoteAddress: string,
  headers: Readonly<Record<string, string>>,
) {
  return {
    headers,
    socket: { remoteAddress },
  } as never;
}
