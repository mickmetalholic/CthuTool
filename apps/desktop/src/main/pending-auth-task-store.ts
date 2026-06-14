export type PendingAuthReason =
  | 'missing'
  | 'expired'
  | 'blocked'
  | 'verification_failed'
  | 'access_failed';

export type PendingAuthSource =
  | 'local_preflight'
  | 'backend_request'
  | 'runtime_failure';

export type PendingAuthTaskStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'dismissed';

export type PendingAuthTask = {
  readonly taskId: string;
  readonly siteId: string;
  readonly profileName: string;
  readonly reason: PendingAuthReason;
  readonly source: PendingAuthSource;
  readonly status: PendingAuthTaskStatus;
  readonly loginUrl?: string;
  readonly verifyUrl?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export class PendingAuthTaskStore {
  private readonly tasks = new Map<string, PendingAuthTask>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  upsert(
    input: Pick<
      PendingAuthTask,
      'profileName' | 'reason' | 'siteId' | 'source'
    > &
      Partial<Pick<PendingAuthTask, 'loginUrl' | 'verifyUrl'>>,
  ): PendingAuthTask {
    const taskId = authTaskId(input.siteId, input.profileName);
    const existing = this.tasks.get(taskId);
    const timestamp = this.now().toISOString();
    const next: PendingAuthTask = {
      taskId,
      createdAt: existing?.createdAt ?? timestamp,
      loginUrl: input.loginUrl ?? existing?.loginUrl,
      profileName: input.profileName,
      reason: input.reason,
      siteId: input.siteId,
      source: input.source,
      status: existing?.status === 'in_progress' ? 'in_progress' : 'open',
      updatedAt: timestamp,
      verifyUrl: input.verifyUrl ?? existing?.verifyUrl,
    };
    this.tasks.set(taskId, next);
    return next;
  }

  resolve(siteId: string, profileName: string): PendingAuthTask | undefined {
    const task = this.tasks.get(authTaskId(siteId, profileName));
    if (!task) {
      return undefined;
    }
    const next: PendingAuthTask = {
      ...task,
      status: 'resolved',
      updatedAt: this.now().toISOString(),
    };
    this.tasks.set(task.taskId, next);
    return next;
  }

  list(): PendingAuthTask[] {
    return [...this.tasks.values()].sort((left, right) =>
      left.updatedAt.localeCompare(right.updatedAt),
    );
  }
}

function authTaskId(siteId: string, profileName: string): string {
  return `${siteId}:${profileName}`;
}
