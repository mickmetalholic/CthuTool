import type { BrowserCommandPayload } from '@cthutool/agent-protocol';

export type BrowserAuthProviderResult = {
  readonly agentId: string;
  readonly status:
    | 'missing'
    | 'login_required'
    | 'verifying'
    | 'verified'
    | 'expired'
    | 'blocked';
  readonly profileName?: string;
  readonly siteId?: string;
  readonly updatedAt?: string;
};

export type BrowserAuthProvider = {
  openLogin(command: BrowserCommandPayload): Promise<BrowserAuthProviderResult>;
  verifyProfile(
    command: BrowserCommandPayload,
  ): Promise<BrowserAuthProviderResult>;
};
