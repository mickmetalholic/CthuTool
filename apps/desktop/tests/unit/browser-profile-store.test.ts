import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
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

  async function createStore(renameFile: typeof rename = rename) {
    tempDir = await mkdtemp(join(tmpdir(), 'cthutool-browser-profile-'));
    return new BrowserProfileStore(
      tempDir,
      () => new Date('2026-06-13T10:00:00.000Z'),
      renameFile,
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

  test('updates existing metadata without dropping display fields', async () => {
    const store = await createStore();
    await store.saveProfile('douban', 'douban-main', {
      displayName: 'Mick',
      externalUserId: '123456',
      status: 'verified',
      verifiedAt: '2026-06-13T10:00:00.000Z',
    });

    const updated = await store.saveProfile('douban', 'douban-main', {
      status: 'login_required',
      verifiedAt: undefined,
    });

    expect(updated).toEqual(
      expect.objectContaining({
        displayName: 'Mick',
        externalUserId: '123456',
        status: 'login_required',
      }),
    );
    expect(updated.verifiedAt).toBeUndefined();
    expect(await store.getProfile('douban', 'douban-main')).toEqual(updated);
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

  test('clears profile metadata and returns undefined for missing profiles', async () => {
    const store = await createStore();
    expect(await store.getProfile('douban', 'douban-main')).toBeUndefined();

    await store.markStatus('douban', 'douban-main', 'verified');
    await store.clearProfile('douban', 'douban-main');

    expect(await store.getProfile('douban', 'douban-main')).toBeUndefined();
    expect(await store.listProfiles()).toEqual([]);
  });

  test('rejects invalid profile metadata files', async () => {
    const store = await createStore();
    const profileDir = store.profileDir('douban', 'douban-main');
    await mkdir(profileDir, { recursive: true });
    await writeFile(
      join(profileDir, 'profile-meta.json'),
      '{"siteId":"douban"}\n',
      'utf8',
    );

    await expect(store.getProfile('douban', 'douban-main')).rejects.toThrow(
      'browser profile metadata is invalid',
    );
  });

  test('retries retryable metadata replacement failures', async () => {
    let attempts = 0;
    const store = await createStore(async (source, target) => {
      attempts += 1;
      if (attempts === 1) {
        throw Object.assign(new Error('file temporarily locked'), {
          code: 'EPERM',
        });
      }
      await rename(source, target);
    });

    const profile = await store.markStatus('douban', 'douban-main', 'verified');
    const raw = await readFile(
      join(store.profileDir('douban', 'douban-main'), 'profile-meta.json'),
      'utf8',
    );

    expect(attempts).toBe(2);
    expect(profile.status).toBe('verified');
    expect(JSON.parse(raw)).toEqual(profile);
  });
});
