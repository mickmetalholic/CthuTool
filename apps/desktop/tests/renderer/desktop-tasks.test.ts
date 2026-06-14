import { describe, expect, test } from 'vitest';
import type { BrowserStatus } from '../../src/renderer/src/agents-api';
import {
  buildDesktopTasks,
  countActionableTasks,
  countTasksByStatus,
} from '../../src/renderer/src/desktop-tasks';

const browserStatus: BrowserStatus = {
  pendingAuthTasks: [
    {
      id: 'agent-1:douban:douban-main',
      agentId: 'agent-1',
      siteId: 'douban',
      profileName: 'douban-main',
      reason: 'missing',
      updatedAt: '2026-06-13T10:00:00.000Z',
    },
  ],
  profiles: [],
  sites: [
    {
      siteId: 'douban',
      displayName: 'Douban',
      allowedOrigins: ['https://movie.douban.com'],
      authPolicy: 'required',
      profileName: 'douban-main',
      loginUrl: 'https://accounts.douban.com/passport/login',
      verifyUrl: 'https://www.douban.com/mine/',
    },
    {
      siteId: 'zhihu',
      displayName: 'Zhihu',
      allowedOrigins: ['https://www.zhihu.com'],
      authPolicy: 'required',
      profileName: 'zhihu-main',
      loginUrl: 'https://www.zhihu.com/signin',
      verifyUrl: 'https://www.zhihu.com/people/me',
    },
  ],
};

describe('desktop task aggregation', () => {
  test('deduplicates backend and local browser auth tasks', () => {
    const tasks = buildDesktopTasks({
      browserStatus,
      localPendingAuthTasks: [
        {
          taskId: 'douban:douban-main',
          siteId: 'douban',
          profileName: 'douban-main',
          reason: 'verification_failed',
          source: 'runtime_failure',
          status: 'open',
          loginUrl: 'https://accounts.douban.com/passport/login',
          verifyUrl: 'https://www.douban.com/mine/',
          createdAt: '2026-06-13T09:59:00.000Z',
          updatedAt: '2026-06-13T10:01:00.000Z',
        },
      ],
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: 'browser-auth:douban:douban-main',
      source: 'backend+local',
      reason: 'verification_failed',
      siteDisplayName: 'Douban',
      loginUrl: 'https://accounts.douban.com/passport/login',
      verifyUrl: 'https://www.douban.com/mine/',
      updatedAt: '2026-06-13T10:01:00.000Z',
    });
  });

  test('counts actionable tasks and sorts unresolved work before resolved items', () => {
    const tasks = buildDesktopTasks({
      browserStatus,
      localPendingAuthTasks: [
        {
          taskId: 'zhihu:zhihu-main',
          siteId: 'zhihu',
          profileName: 'zhihu-main',
          reason: 'blocked',
          source: 'runtime_failure',
          status: 'open',
          createdAt: '2026-06-13T10:00:00.000Z',
          updatedAt: '2026-06-13T10:02:00.000Z',
        },
        {
          taskId: 'resolved:profile',
          siteId: 'resolved',
          profileName: 'profile',
          reason: 'missing',
          source: 'backend_request',
          status: 'resolved',
          createdAt: '2026-06-13T10:00:00.000Z',
          updatedAt: '2026-06-13T10:03:00.000Z',
        },
      ],
    });

    expect(tasks.map((task) => task.siteId)).toEqual([
      'zhihu',
      'douban',
      'resolved',
    ]);
    expect(countActionableTasks(tasks)).toBe(2);
    expect(countTasksByStatus(tasks)).toMatchObject({
      failed: 1,
      open: 1,
      resolved: 1,
    });
  });
});
