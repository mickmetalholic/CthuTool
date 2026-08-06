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

  test('rejects invalid environment ids', () => {
    expect(() =>
      readOperatorAccessConfiguration({
        CTHUTOOL_ENVIRONMENT_ID: 'Prod',
      }),
    ).toThrow(/environment id/);
  });

  test('accepts private-network operator peers and rejects public peers', () => {
    stubEnvironment();
    const access = new SingleOperatorAccessService();
    expect(() => access.assertOperator(request('10.0.0.2'))).not.toThrow();
    expect(() => access.assertOperator(request('127.0.0.1'))).not.toThrow();
    expect(() => access.assertOperator(request('192.168.1.10'))).not.toThrow();
    expect(() => access.assertOperator(request('::1'))).not.toThrow();
    expect(() => access.assertOperator(request('fc00::1'))).not.toThrow();
    expect(() => access.assertOperator(request('203.0.113.10'))).toThrow(
      UnauthorizedException,
    );
  });

  test('ignores forwarded IP and gateway identity headers', () => {
    stubEnvironment();
    const access = new SingleOperatorAccessService();
    expect(() =>
      access.assertOperator(
        request('203.0.113.10', {
          'x-forwarded-for': '10.0.0.2',
          'x-cthutool-operator': 'owner@example.com',
        }),
      ),
    ).toThrow(UnauthorizedException);
    expect(() =>
      access.assertOperator(
        request('10.0.0.2', {
          'x-forwarded-for': '203.0.113.10',
          'x-cthutool-operator': 'spoofed@example.com',
        }),
      ),
    ).not.toThrow();
  });

  test('authenticates private-network Agents by environment id only', () => {
    stubEnvironment();
    const access = new SingleOperatorAccessService();
    const valid = access.authenticateAgent(
      request('10.0.0.2', {
        'x-cthutool-environment-id': 'prod',
      }),
    );
    const withUnusedAuthorization = access.authenticateAgent(
      request('127.0.0.1', {
        authorization: `Agent ${'x'.repeat(32)}`,
        'x-cthutool-environment-id': 'prod',
      }),
    );
    const publicPeer = access.authenticateAgent(
      request('203.0.113.10', {
        'x-cthutool-environment-id': 'prod',
      }),
    );
    const mismatch = access.authenticateAgent(
      request('10.0.0.2', {
        'x-cthutool-environment-id': 'test',
      }),
    );

    expect(valid).toEqual({ ok: true, environmentId: 'prod' });
    expect(withUnusedAuthorization).toEqual({
      ok: true,
      environmentId: 'prod',
    });
    expect(publicPeer).toEqual({ ok: false, category: 'public_peer' });
    expect(mismatch).toEqual({
      ok: false,
      category: 'environment_mismatch',
    });
    expect(JSON.stringify(publicPeer)).not.toContain('203.0.113.10');
  });
});

function stubEnvironment(): void {
  vi.stubEnv('CTHUTOOL_ENVIRONMENT_ID', 'prod');
}

function request(
  remoteAddress: string,
  headers: Readonly<Record<string, string>> = {},
) {
  return {
    headers,
    socket: { remoteAddress },
  } as never;
}
