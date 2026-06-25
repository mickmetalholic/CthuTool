import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { BrowserProfileStore } from '../../src/main/browser-profile-store';

describe('BrowserProfileStore', () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { force: true, recursive: true });
      tempDir = undefined;
    }
  });

  async function createStore() {
    tempDir = await mkdtemp(join(tmpdir(), 'cthutool-browser-profile-'));
    return new BrowserProfileStore(
      tempDir,
      () => new Date('2026-06-13T10:00:00.000Z'),
    );
  }

  test('stores non-sensitive profile metadata', async () => {
    const store = await createStore();

    const profile = await store.saveProfile('douban', 'douban-main', {
      displayName: 'Mick',
      externalUserId: '123456',
      status: 'verified',
      verifiedAt: '2026-06-13T10:00:00.000Z',
    });

    expect(profile).toEqual({
      displayName: 'Mick',
      externalUserId: '123456',
      profileName: 'douban-main',
      siteId: 'douban',
      status: 'verified',
      updatedAt: '2026-06-13T10:00:00.000Z',
      verifiedAt: '2026-06-13T10:00:00.000Z',
    });
    expect(store.toPublicProfile('agent-1', profile)).toEqual({
      agentId: 'agent-1',
      ...profile,
    });
  });

  test('marks an existing profile expired and clears stale verification metadata', async () => {
    const store = await createStore();
    await store.markStatus('zhihu', 'zhihu-main', 'verified');

    const expired = await store.markStatus('zhihu', 'zhihu-main', 'expired');

    expect(expired.status).toBe('expired');
    expect(expired.verifiedAt).toBeUndefined();
  });

  test('serializes concurrent metadata saves for the same profile', async () => {
    const store = await createStore();

    await Promise.all([
      store.saveProfile('douban', 'douban-main', {
        displayName: 'Cthu User',
        status: 'login_required',
      }),
      store.saveProfile('douban', 'douban-main', {
        status: 'expired',
      }),
      store.saveProfile('douban', 'douban-main', {
        externalUserId: '50353979',
        status: 'verified',
        verifiedAt: '2026-06-13T10:00:00.000Z',
      }),
    ]);

    expect(await store.getProfile('douban', 'douban-main')).toEqual({
      displayName: 'Cthu User',
      externalUserId: '50353979',
      profileName: 'douban-main',
      siteId: 'douban',
      status: 'verified',
      updatedAt: '2026-06-13T10:00:00.000Z',
      verifiedAt: '2026-06-13T10:00:00.000Z',
    });
  });

  test('lists local profile metadata for state projection', async () => {
    const store = await createStore();
    await store.markStatus('douban', 'douban-main', 'verified');
    await store.markStatus('zhihu', 'zhihu-main', 'login_required');

    expect(await store.listProfiles()).toEqual([
      expect.objectContaining({
        profileName: 'douban-main',
        siteId: 'douban',
        status: 'verified',
      }),
      expect.objectContaining({
        profileName: 'zhihu-main',
        siteId: 'zhihu',
        status: 'login_required',
      }),
    ]);
  });
});
