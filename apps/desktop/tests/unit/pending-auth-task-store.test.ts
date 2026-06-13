import { describe, expect, test } from 'vitest';
import { PendingAuthTaskStore } from '../../src/main/pending-auth-task-store';

describe('PendingAuthTaskStore', () => {
  test('coalesces tasks for the same site profile', () => {
    const store = new PendingAuthTaskStore(
      () => new Date('2026-06-13T10:00:00.000Z'),
    );

    const first = store.upsert({
      profileName: 'douban-main',
      reason: 'missing',
      siteId: 'douban',
      source: 'local_preflight',
    });
    const second = store.upsert({
      profileName: 'douban-main',
      reason: 'expired',
      siteId: 'douban',
      source: 'runtime_failure',
    });

    expect(first.taskId).toBe(second.taskId);
    expect(store.list()).toHaveLength(1);
    expect(store.list()[0]).toEqual(
      expect.objectContaining({
        reason: 'expired',
        source: 'runtime_failure',
        status: 'open',
      }),
    );
  });

  test('resolves matching auth tasks', () => {
    const store = new PendingAuthTaskStore(
      () => new Date('2026-06-13T10:00:00.000Z'),
    );
    store.upsert({
      profileName: 'zhihu-main',
      reason: 'missing',
      siteId: 'zhihu',
      source: 'backend_request',
    });

    expect(store.resolve('zhihu', 'zhihu-main')).toEqual(
      expect.objectContaining({ status: 'resolved' }),
    );
  });
});
