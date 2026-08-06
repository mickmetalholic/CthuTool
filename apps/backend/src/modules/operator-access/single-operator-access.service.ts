import type { IncomingMessage } from 'node:http';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { isPrivateNetworkPeer } from './private-network-peer';

export type OperatorAccessConfiguration = {
  readonly environmentId: string;
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

  assertOperator(request: HttpRequest): void {
    if (!isPrivateNetworkPeer(request.socket.remoteAddress)) {
      throw new UnauthorizedException(
        'Private Agent APIs require a private-network peer',
      );
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
    if (!isPrivateNetworkPeer(request.socket.remoteAddress)) {
      return { ok: false, category: 'public_peer' };
    }
    return { ok: true, environmentId };
  }
}

export function readOperatorAccessConfiguration(
  env: NodeJS.ProcessEnv,
): OperatorAccessConfiguration {
  const environmentId = env.CTHUTOOL_ENVIRONMENT_ID?.trim() || 'local';
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(environmentId)) {
    throw new Error('Backend environment id is invalid');
  }
  return { environmentId };
}

function readSingleHeader(
  value: string | readonly string[] | undefined,
): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}
