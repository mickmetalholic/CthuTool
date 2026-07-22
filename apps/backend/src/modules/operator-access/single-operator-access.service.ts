import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { Injectable, UnauthorizedException } from '@nestjs/common';

export type OperatorAccessConfiguration = {
  readonly environmentId: string;
  readonly nodeEnv: string;
  readonly mode: 'trusted-proxy' | 'private-development';
  readonly gatewayHeader: string;
  readonly trustedProxyIps: readonly string[];
  readonly agentSecret?: string;
};

type HttpRequest = IncomingMessage & {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
};

@Injectable()
export class SingleOperatorAccessService {
  private readonly configuration: OperatorAccessConfiguration;

  constructor() {
    this.configuration = readOperatorAccessConfiguration(process.env);
  }

  get environmentId(): string {
    return this.configuration.environmentId;
  }

  get privateDevelopment(): boolean {
    return this.configuration.mode === 'private-development';
  }

  assertOperator(request: HttpRequest): void {
    if (this.privateDevelopment) {
      if (!isLoopback(request.socket.remoteAddress)) {
        throw new UnauthorizedException('Private Agent APIs require loopback');
      }
      return;
    }
    const remoteAddress = normalizeIp(request.socket.remoteAddress);
    if (!this.configuration.trustedProxyIps.includes(remoteAddress)) {
      throw new UnauthorizedException('Untrusted operator access path');
    }
    const identity = readSingleHeader(
      request.headers[this.configuration.gatewayHeader],
    );
    if (!identity || identity.length > 256) {
      throw new UnauthorizedException('Operator identity is required');
    }
  }

  authenticateAgent(
    request: IncomingMessage,
  ):
    | { readonly ok: true; readonly environmentId: string }
    | { readonly ok: false; readonly category: string } {
    const environmentId = readSingleHeader(
      request.headers['x-cthutool-environment-id'],
    );
    if (environmentId !== this.configuration.environmentId) {
      return { ok: false, category: 'environment_mismatch' };
    }
    if (this.privateDevelopment) {
      return isLoopback(request.socket.remoteAddress)
        ? { ok: true, environmentId }
        : { ok: false, category: 'private_mode_non_loopback' };
    }
    const authorization = readSingleHeader(request.headers.authorization);
    const presented = authorization?.startsWith('Agent ')
      ? authorization.slice('Agent '.length)
      : undefined;
    const expected = this.configuration.agentSecret;
    if (!presented || !expected || !constantTimeEqual(expected, presented)) {
      return { ok: false, category: 'agent_secret_invalid' };
    }
    return { ok: true, environmentId };
  }
}

export function readOperatorAccessConfiguration(
  env: NodeJS.ProcessEnv,
): OperatorAccessConfiguration {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const testMode = nodeEnv === 'test';
  const privateDevelopment =
    testMode || env.CTHUTOOL_PRIVATE_DEVELOPMENT === '1';
  if (nodeEnv === 'production' && privateDevelopment) {
    throw new Error('Private Agent access cannot run in production');
  }
  const mode =
    env.CTHUTOOL_OPERATOR_ACCESS_MODE ??
    (privateDevelopment ? 'private-development' : undefined);
  if (mode !== 'trusted-proxy' && mode !== 'private-development') {
    throw new Error('Operator access boundary is not configured');
  }
  const trustedProxyIps = (env.CTHUTOOL_TRUSTED_PROXY_IPS ?? '')
    .split(',')
    .map(normalizeIp)
    .filter(Boolean);
  if (mode === 'trusted-proxy' && trustedProxyIps.length === 0) {
    throw new Error('Trusted proxy access requires explicit proxy IPs');
  }
  const agentSecret = env.CTHUTOOL_AGENT_SECRET?.trim();
  if (mode === 'trusted-proxy' && (!agentSecret || agentSecret.length < 32)) {
    throw new Error('Public Agent access requires a strong static secret');
  }
  const gatewayHeader = (
    env.CTHUTOOL_OPERATOR_GATEWAY_HEADER ?? 'x-cthutool-operator'
  ).toLowerCase();
  if (!/^[a-z0-9-]{1,64}$/.test(gatewayHeader)) {
    throw new Error('Operator gateway header name is invalid');
  }
  const environmentId = env.CTHUTOOL_ENVIRONMENT_ID?.trim() || 'local';
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(environmentId)) {
    throw new Error('Backend environment id is invalid');
  }
  return {
    agentSecret,
    environmentId,
    gatewayHeader,
    mode,
    nodeEnv,
    trustedProxyIps,
  };
}

function readSingleHeader(
  value: string | readonly string[] | undefined,
): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function normalizeIp(input: string | undefined): string {
  return (input ?? '').replace(/^::ffff:/, '').trim();
}

function isLoopback(input: string | undefined): boolean {
  return ['127.0.0.1', '::1'].includes(normalizeIp(input));
}

function constantTimeEqual(expected: string, presented: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const presentedBytes = Buffer.from(presented);
  if (expectedBytes.length !== presentedBytes.length) {
    const padded = Buffer.alloc(expectedBytes.length);
    presentedBytes.copy(padded, 0, 0, expectedBytes.length);
    timingSafeEqual(expectedBytes, padded);
    return false;
  }
  return timingSafeEqual(expectedBytes, presentedBytes);
}
