import { describe, expect, test } from 'vitest';
import { PendingAuthTaskStore } from '../../src/main/pending-auth-task-store';

describe('PendingAuthTaskStore', () => {
  function createClock() {
    let current = new Date('2026-06-13T10:00:00.000Z');
    return {
      advanceTo(value: string) {
        current = new Date(value);
      },
      now: () => current,
    };
  }

  test('coalesces tasks for the same site profile', () => {
    const clock = createClock();
    const store = new PendingAuthTaskStore(clock.now);

    const first = store.upsert({
      loginUrl: 'https://accounts.douban.com/passport/login',
      profileName: 'douban-main',
      reason: 'missing',
      siteId: 'douban',
      source: 'local_preflight',
      verifyUrl: 'https://www.douban.com/mine/',
    });
    clock.advanceTo('2026-06-13T10:01:00.000Z');
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
        createdAt: '2026-06-13T10:00:00.000Z',
        loginUrl: 'https://accounts.douban.com/passport/login',
        reason: 'expired',
        source: 'runtime_failure',
        status: 'open',
        updatedAt: '2026-06-13T10:01:00.000Z',
        verifyUrl: 'https://www.douban.com/mine/',
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

  test('returns undefined when resolving a missing task', () => {
    const store = new PendingAuthTaskStore(
      () => new Date('2026-06-13T10:00:00.000Z'),
    );

    expect(store.resolve('douban', 'douban-main')).toBeUndefined();
  });

  test('sorts tasks by updated time for stable projection', () => {
    const clock = createClock();
    const store = new PendingAuthTaskStore(clock.now);
    store.upsert({
      profileName: 'first',
      reason: 'missing',
      siteId: 'douban',
      source: 'local_preflight',
    });
    clock.advanceTo('2026-06-13T10:01:00.000Z');
    store.upsert({
      profileName: 'second',
      reason: 'blocked',
      siteId: 'douban',
      source: 'runtime_failure',
    });
    clock.advanceTo('2026-06-13T10:02:00.000Z');
    store.upsert({
      profileName: 'first',
      reason: 'access_failed',
      siteId: 'douban',
      source: 'backend_request',
    });

    expect(store.list().map((task) => task.profileName)).toEqual([
      'second',
      'first',
    ]);
  });
});
