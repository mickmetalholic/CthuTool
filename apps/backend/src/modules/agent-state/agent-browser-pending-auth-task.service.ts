import { Injectable } from '@nestjs/common';
import type {
  AgentBrowserPendingAuthTask,
  UpsertAgentBrowserPendingAuthTaskInput,
} from './agent-state.types';

@Injectable()
export class AgentBrowserPendingAuthTaskService {
  private readonly tasks = new Map<string, AgentBrowserPendingAuthTask>();

  upsert(
    input: UpsertAgentBrowserPendingAuthTaskInput,
  ): AgentBrowserPendingAuthTask {
    const now = new Date().toISOString();
    const key = taskKey(input.agentId, input.siteId, input.profileName);
    const existing = this.tasks.get(key);
    const task: AgentBrowserPendingAuthTask = {
      agentId: input.agentId,
      createdAt: existing?.createdAt ?? now,
      id: key,
      profileName: input.profileName,
      reason: input.reason,
      siteId: input.siteId,
      updatedAt: now,
    };
    if (input.loginUrl !== undefined) {
      task.loginUrl = input.loginUrl;
    }
    if (input.verifyUrl !== undefined) {
      task.verifyUrl = input.verifyUrl;
    }
    this.tasks.set(key, task);
    return copyTask(task);
  }

  resolve(agentId: string, siteId: string, profileName: string): void {
    this.tasks.delete(taskKey(agentId, siteId, profileName));
  }

  replaceForAgent(
    agentId: string,
    tasks: readonly AgentBrowserPendingAuthTask[],
  ): AgentBrowserPendingAuthTask[] {
    for (const key of this.tasks.keys()) {
      if (key.startsWith(`${agentId}:`)) {
        this.tasks.delete(key);
      }
    }

    for (const task of tasks) {
      const key = taskKey(agentId, task.siteId, task.profileName);
      this.tasks.set(
        key,
        copyTask({
          ...task,
          agentId,
          id: key,
        }),
      );
    }

    return this.list().filter((task) => task.agentId === agentId);
  }

  list(): AgentBrowserPendingAuthTask[] {
    return [...this.tasks.values()]
      .map(copyTask)
      .sort((left, right) => left.id.localeCompare(right.id));
  }
}

function taskKey(agentId: string, siteId: string, profileName: string): string {
  return `${agentId}:${siteId}:${profileName}`;
}

function copyTask(
  task: AgentBrowserPendingAuthTask,
): AgentBrowserPendingAuthTask {
  const copy: AgentBrowserPendingAuthTask = {
    agentId: task.agentId,
    createdAt: task.createdAt,
    id: task.id,
    profileName: task.profileName,
    reason: task.reason,
    siteId: task.siteId,
    updatedAt: task.updatedAt,
  };

  if (task.loginUrl !== undefined) {
    copy.loginUrl = task.loginUrl;
  }
  if (task.verifyUrl !== undefined) {
    copy.verifyUrl = task.verifyUrl;
  }

  return copy;
}
