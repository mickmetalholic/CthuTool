import type { BrowserStatus } from './agents-api';
import type { DesktopApi } from './desktop-api';

export type LocalPendingAuthTask = Awaited<
  ReturnType<DesktopApi['getLocalPendingAuthTasks']>
>[number];

export type DesktopTaskStatus =
  | 'open'
  | 'in_progress'
  | 'failed'
  | 'resolved'
  | 'dismissed';

export type DesktopTaskSource = 'backend' | 'local' | 'backend+local';

export type DesktopTask = {
  readonly id: string;
  readonly type: 'browser-auth';
  readonly title: string;
  readonly source: DesktopTaskSource;
  readonly status: DesktopTaskStatus;
  readonly siteId: string;
  readonly siteDisplayName: string;
  readonly profileName: string;
  readonly reason: string;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly updatedAt?: string;
};

export function buildDesktopTasks({
  browserStatus,
  localPendingAuthTasks,
}: {
  readonly browserStatus: BrowserStatus;
  readonly localPendingAuthTasks: readonly LocalPendingAuthTask[];
}): DesktopTask[] {
  const sites = new Map(browserStatus.sites.map((site) => [site.siteId, site]));
  const tasks = new Map<string, DesktopTask>();

  for (const task of browserStatus.pendingAuthTasks) {
    const site = sites.get(task.siteId);
    tasks.set(taskKey(task.siteId, task.profileName), {
      id: taskKey(task.siteId, task.profileName),
      type: 'browser-auth',
      title: `${site?.displayName ?? task.siteId} login required`,
      source: 'backend',
      status: statusForReason(task.reason),
      siteId: task.siteId,
      siteDisplayName: site?.displayName ?? task.siteId,
      profileName: task.profileName,
      reason: task.reason,
      loginUrl: site?.loginUrl,
      verifyUrl: site?.verifyUrl,
      updatedAt: task.updatedAt,
    });
  }

  for (const task of localPendingAuthTasks) {
    const site = sites.get(task.siteId);
    const key = taskKey(task.siteId, task.profileName);
    const existing = tasks.get(key);
    const localTask: DesktopTask = {
      id: key,
      type: 'browser-auth',
      title: `${site?.displayName ?? task.siteId} login required`,
      source: 'local',
      status: normalizeLocalStatus(task.status, task.reason),
      siteId: task.siteId,
      siteDisplayName: site?.displayName ?? task.siteId,
      profileName: task.profileName,
      reason: task.reason,
      loginUrl: task.loginUrl ?? site?.loginUrl,
      verifyUrl: task.verifyUrl ?? site?.verifyUrl,
      updatedAt: task.updatedAt,
    };

    tasks.set(
      key,
      existing
        ? {
            ...existing,
            source: 'backend+local',
            status: mergeTaskStatus(existing.status, localTask.status),
            reason: localTask.reason || existing.reason,
            loginUrl: localTask.loginUrl ?? existing.loginUrl,
            verifyUrl: localTask.verifyUrl ?? existing.verifyUrl,
            updatedAt: latestTimestamp(existing.updatedAt, localTask.updatedAt),
          }
        : localTask,
    );
  }

  return [...tasks.values()].sort(compareDesktopTasks);
}

export function countActionableTasks(tasks: readonly DesktopTask[]): number {
  return tasks.filter((task) =>
    ['open', 'in_progress', 'failed'].includes(task.status),
  ).length;
}

export function countTasksByStatus(
  tasks: readonly DesktopTask[],
): Record<DesktopTaskStatus, number> {
  const counts: Record<DesktopTaskStatus, number> = {
    dismissed: 0,
    failed: 0,
    in_progress: 0,
    open: 0,
    resolved: 0,
  };
  for (const task of tasks) {
    counts[task.status] += 1;
  }
  return counts;
}

function taskKey(siteId: string, profileName: string): string {
  return `browser-auth:${siteId}:${profileName}`;
}

function normalizeLocalStatus(
  status: string,
  reason: string,
): DesktopTaskStatus {
  const reasonStatus = statusForReason(reason);
  if (reasonStatus === 'failed') {
    return reasonStatus;
  }
  if (
    status === 'open' ||
    status === 'in_progress' ||
    status === 'resolved' ||
    status === 'dismissed'
  ) {
    return status;
  }
  return reasonStatus;
}

function statusForReason(reason: string): DesktopTaskStatus {
  return reason === 'blocked' ||
    reason === 'verification_failed' ||
    reason === 'access_failed'
    ? 'failed'
    : 'open';
}

function mergeTaskStatus(
  left: DesktopTaskStatus,
  right: DesktopTaskStatus,
): DesktopTaskStatus {
  return statusPriority(left) <= statusPriority(right) ? left : right;
}

function compareDesktopTasks(left: DesktopTask, right: DesktopTask): number {
  const statusDelta =
    statusPriority(left.status) - statusPriority(right.status);
  if (statusDelta !== 0) return statusDelta;
  const timestampDelta =
    timestampValue(right.updatedAt) - timestampValue(left.updatedAt);
  if (timestampDelta !== 0) return timestampDelta;
  return left.title.localeCompare(right.title);
}

function statusPriority(status: DesktopTaskStatus): number {
  switch (status) {
    case 'failed':
      return 0;
    case 'open':
      return 1;
    case 'in_progress':
      return 2;
    case 'resolved':
      return 3;
    case 'dismissed':
      return 4;
  }
}

function timestampValue(value: string | undefined): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function latestTimestamp(
  left: string | undefined,
  right: string | undefined,
): string | undefined {
  return timestampValue(left) >= timestampValue(right) ? left : right;
}
