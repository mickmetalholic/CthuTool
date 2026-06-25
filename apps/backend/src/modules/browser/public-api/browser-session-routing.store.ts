import { Injectable } from '@nestjs/common';

export type BrowserSessionStatus = 'active' | 'closing' | 'closed';

export type BrowserSessionRoutingRecord = {
  readonly sessionId: string;
  readonly agentId: string;
  readonly siteId: string;
  readonly profileName?: string;
  readonly authPolicy: 'anonymous' | 'required';
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly lastUsedAt: string;
  readonly status: BrowserSessionStatus;
};

export type CreateBrowserSessionRoutingRecord = {
  readonly sessionId: string;
  readonly agentId: string;
  readonly siteId: string;
  readonly profileName?: string;
  readonly authPolicy: 'anonymous' | 'required';
  readonly expiresAt: string;
};

@Injectable()
export class BrowserSessionRoutingStore {
  private readonly sessions = new Map<string, BrowserSessionRoutingRecord>();
  private now: () => Date = () => new Date();

  setNowForTesting(now: () => Date): void {
    this.now = now;
  }

  create(
    input: CreateBrowserSessionRoutingRecord,
  ): BrowserSessionRoutingRecord {
    const timestamp = this.now().toISOString();
    const record: BrowserSessionRoutingRecord = {
      agentId: input.agentId,
      authPolicy: input.authPolicy,
      createdAt: timestamp,
      expiresAt: input.expiresAt,
      lastUsedAt: timestamp,
      profileName: input.profileName,
      sessionId: input.sessionId,
      siteId: input.siteId,
      status: 'active',
    };
    this.sessions.set(record.sessionId, record);
    return record;
  }

  get(sessionId: string): BrowserSessionRoutingRecord | undefined {
    const record = this.sessions.get(sessionId);
    if (!record || record.status !== 'active') {
      return undefined;
    }
    if (this.isExpired(record)) {
      this.sessions.set(sessionId, {
        ...record,
        status: 'closed',
      });
      return undefined;
    }
    return record;
  }

  touch(sessionId: string): BrowserSessionRoutingRecord | undefined {
    const record = this.get(sessionId);
    if (!record) {
      return undefined;
    }
    const updated = {
      ...record,
      lastUsedAt: this.now().toISOString(),
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  close(sessionId: string): BrowserSessionRoutingRecord | undefined {
    const record = this.sessions.get(sessionId);
    if (!record) {
      return undefined;
    }
    const updated = {
      ...record,
      status: 'closed' as const,
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  expireByAgent(agentId: string): BrowserSessionRoutingRecord[] {
    const expired: BrowserSessionRoutingRecord[] = [];
    for (const record of this.sessions.values()) {
      if (record.agentId !== agentId || record.status !== 'active') {
        continue;
      }
      const closed = {
        ...record,
        status: 'closed' as const,
      };
      this.sessions.set(record.sessionId, closed);
      expired.push(closed);
    }
    return expired;
  }

  collectExpired(): BrowserSessionRoutingRecord[] {
    const expired: BrowserSessionRoutingRecord[] = [];
    for (const record of this.sessions.values()) {
      if (record.status === 'active' && this.isExpired(record)) {
        const closed = {
          ...record,
          status: 'closed' as const,
        };
        this.sessions.set(record.sessionId, closed);
        expired.push(closed);
      }
    }
    return expired;
  }

  private isExpired(record: BrowserSessionRoutingRecord): boolean {
    return Date.parse(record.expiresAt) <= this.now().getTime();
  }
}
