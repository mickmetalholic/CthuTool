import { Injectable } from '@nestjs/common';
import type {
  BrowserPendingAuthReason,
  BrowserPendingAuthTask,
} from './browser-automation.types';

export type UpsertBrowserPendingAuthTaskInput = {
  readonly agentId: string;
  readonly siteId: string;
  readonly profileName: string;
  readonly reason: BrowserPendingAuthReason;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
};

@Injectable()
export class BrowserPendingAuthTaskService {
  private readonly tasks = new Map<string, BrowserPendingAuthTask>();

  upsert(input: UpsertBrowserPendingAuthTaskInput): BrowserPendingAuthTask {
    const now = new Date().toISOString();
    const key = taskKey(input.agentId, input.siteId, input.profileName);
    const existing = this.tasks.get(key);
    const task: BrowserPendingAuthTask = {
      agentId: input.agentId,
      createdAt: existing?.createdAt ?? now,
      id: key,
      loginUrl: input.loginUrl,
      profileName: input.profileName,
      reason: input.reason,
      siteId: input.siteId,
      updatedAt: now,
      verifyUrl: input.verifyUrl,
    };
    this.tasks.set(key, task);
    return { ...task };
  }

  resolve(agentId: string, siteId: string, profileName: string): void {
    this.tasks.delete(taskKey(agentId, siteId, profileName));
  }

  replaceForAgent(
    agentId: string,
    tasks: readonly BrowserPendingAuthTask[],
  ): BrowserPendingAuthTask[] {
    for (const key of this.tasks.keys()) {
      if (key.startsWith(`${agentId}:`)) {
        this.tasks.delete(key);
      }
    }

    for (const task of tasks) {
      const key = taskKey(agentId, task.siteId, task.profileName);
      this.tasks.set(key, {
        ...task,
        agentId,
        id: key,
      });
    }

    return this.list().filter((task) => task.agentId === agentId);
  }

  list(): BrowserPendingAuthTask[] {
    return [...this.tasks.values()]
      .map((task) => ({ ...task }))
      .sort((left, right) => left.id.localeCompare(right.id));
  }
}

function taskKey(agentId: string, siteId: string, profileName: string): string {
  return `${agentId}:${siteId}:${profileName}`;
}
