import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { resolveAgentDataPaths } from './config';
import {
  applySelfUseCandidate,
  createSelfUseCatalog,
  deriveSelfUseEndpoints,
  getSelfUseSetupState,
  migrateToSelfUseConfig,
  readSelfUseConfig,
  redactSelfUseConfigForLog,
  redactSelfUseConfigForPersistence,
  SELF_USE_ENVIRONMENT_ID,
  validateDeploymentOrigin,
  writeSelfUseConfig,
} from './self-use-config';

describe('self-use configuration and routing', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('validates exact Origin and derives fixed self-use endpoints', () => {
    expect(validateDeploymentOrigin('https://app.example.com')).toBe(
      'https://app.example.com',
    );
    expect(() =>
      validateDeploymentOrigin('https://app.example.com/agent'),
    ).toThrow(/exact Origin/);
    expect(() => validateDeploymentOrigin('http://app.example.com')).toThrow(
      /https/,
    );
    expect(() =>
      validateDeploymentOrigin('https://app.example.com?x=1'),
    ).toThrow(/exact Origin/);
    expect(
      validateDeploymentOrigin('http://localhost:5173', {
        allowDevelopmentLocalhost: true,
      }),
    ).toBe('http://localhost:5173');

    expect(deriveSelfUseEndpoints('https://app.example.com')).toEqual({
      backendAgentWsUrl: 'wss://app.example.com/ws/agents',
      backendHttpUrl: 'https://app.example.com',
      environmentId: 'self-use',
      label: 'Self-use',
      namespace: 'self-use',
      trust: 'release',
      webAgentUrl: 'https://app.example.com/agent',
      webOrigin: 'https://app.example.com',
    });
    expect(
      createSelfUseCatalog('https://app.example.com').profiles,
    ).toHaveLength(1);
  });

  test('writes versioned config atomically without secret state', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-self-use-'));
    const paths = resolveAgentDataPaths({ rootDir: root });
    const written = writeSelfUseConfig(paths, {
      agentId: 'agent-1',
      browserRuntime: { kind: 'host-chrome' },
      connectionEnabled: true,
      deploymentOrigin: 'https://app.example.com',
      deviceName: 'Desk',
      schemaVersion: 1,
    });
    await mkdir(join(root, 'environments/self-use'), { recursive: true });
    await writeFile(
      join(root, 'environments/self-use/agent-secret'),
      'legacy-secret\n',
    );

    const persisted = JSON.parse(await readFile(paths.configPath, 'utf8')) as {
      schemaVersion: number;
      deploymentOrigin: string;
      agentSecret?: string;
    };
    expect(persisted.schemaVersion).toBe(1);
    expect(persisted.deploymentOrigin).toBe('https://app.example.com');
    expect(persisted.agentSecret).toBeUndefined();
    expect(redactSelfUseConfigForPersistence(written)).not.toHaveProperty(
      'agentSecret',
    );
    expect(redactSelfUseConfigForLog(written)).not.toHaveProperty('secret');
    expect(
      await readFile(join(root, 'environments/self-use/agent-secret'), 'utf8'),
    ).toBe('legacy-secret\n');
  });

  test('rolls back to last known-good configuration when candidate apply fails', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-self-use-rollback-'));
    const paths = resolveAgentDataPaths({ rootDir: root });
    applySelfUseCandidate(paths, {
      deploymentOrigin: 'https://good.example.com',
      deviceName: 'Good',
    });

    expect(() =>
      applySelfUseCandidate(paths, {
        deploymentOrigin: 'https://bad.example.com/path',
      }),
    ).toThrow(/exact Origin/);

    expect(readSelfUseConfig(paths)?.deploymentOrigin).toBe(
      'https://good.example.com',
    );
  });

  test('recovers from malformed config through native setup state', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-self-use-malformed-'));
    const paths = resolveAgentDataPaths({ rootDir: root });
    await writeFile(paths.configPath, '{malformed json');

    const state = getSelfUseSetupState(paths);

    expect(state.setupRequired).toBe(true);
    expect(state.configured).toBe(false);
    expect(readSelfUseConfig(paths)).toMatchObject({
      schemaVersion: 1,
      deploymentOrigin: undefined,
    });
  });

  test('migrates a single-environment installation without deleting namespaces', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-self-use-migrate-'));
    const paths = resolveAgentDataPaths({ rootDir: root });
    await mkdir(join(root, 'environments/prod'), { recursive: true });
    await writeFile(
      join(root, 'environment.json'),
      `${JSON.stringify({ activeEnvironmentId: 'prod' })}\n`,
    );
    await writeFile(
      join(root, 'environments.json'),
      `${JSON.stringify({
        profiles: [
          {
            environmentId: 'prod',
            label: 'Production',
            namespace: 'prod',
            webOrigin: 'https://app.example.com',
            webAgentUrl: 'https://app.example.com/agent',
            backendHttpUrl: 'https://app.example.com',
            backendAgentWsUrl: 'wss://app.example.com/ws/agents',
          },
        ],
      })}\n`,
    );
    await writeFile(
      join(root, 'environments/prod/agent-secret'),
      `${'p'.repeat(32)}\n`,
    );

    const migrated = migrateToSelfUseConfig(paths);
    expect(migrated.migrated).toBe(true);
    expect(migrated.config.deploymentOrigin).toBe('https://app.example.com');
    expect(migrated.preservedEnvironmentNamespaces).toEqual(['prod']);
    expect(
      await readFile(join(root, 'environments/prod/agent-secret'), 'utf8'),
    ).toBe(`${'p'.repeat(32)}\n`);
    await expect(
      readFile(join(root, 'environments/self-use/agent-secret'), 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    expect(getSelfUseSetupState(paths).configured).toBe(true);
    expect(getSelfUseSetupState(paths).endpoints?.environmentId).toBe(
      SELF_USE_ENVIRONMENT_ID,
    );
  });

  test('preserves multi-environment data and reports a migration notice', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-self-use-multi-'));
    const paths = resolveAgentDataPaths({ rootDir: root });
    await mkdir(join(root, 'environments/prod'), { recursive: true });
    await mkdir(join(root, 'environments/test'), { recursive: true });
    await writeFile(
      join(root, 'environments/prod/config.json'),
      `${JSON.stringify({ deviceName: 'Prod' })}\n`,
    );

    const migrated = migrateToSelfUseConfig(paths);
    expect(migrated.migrated).toBe(false);
    expect(migrated.notice).toMatch(/Multiple environment/);
    expect(migrated.preservedEnvironmentNamespaces).toEqual(
      expect.arrayContaining(['prod', 'test']),
    );
    expect(getSelfUseSetupState(paths).setupRequired).toBe(true);
  });

  test('merges an unambiguous legacy namespace after native self-use bootstrap', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-self-use-merge-'));
    const paths = resolveAgentDataPaths({ rootDir: root });
    writeSelfUseConfig(paths, {
      agentId: 'agent-self-use',
      browserRuntime: { kind: 'host-chrome' },
      connectionEnabled: true,
      deploymentOrigin: 'https://app.example.com',
      deviceName: 'Desk',
      schemaVersion: 1,
    });
    const legacyProfile = join(
      root,
      'environments',
      'prod',
      'browser-profiles',
      'site',
    );
    await mkdir(legacyProfile, { recursive: true });
    await writeFile(join(legacyProfile, 'state'), 'legacy-profile');

    const first = migrateToSelfUseConfig(paths);
    expect(first.migrated).toBe(true);
    expect(first.notice).toMatch(/unambiguous legacy/i);
    expect(await readFile(join(legacyProfile, 'state'), 'utf8')).toBe(
      'legacy-profile',
    );
    expect(
      await readFile(
        join(
          root,
          'environments',
          'self-use',
          'browser-profiles',
          'site',
          'state',
        ),
        'utf8',
      ),
    ).toBe('legacy-profile');

    const second = migrateToSelfUseConfig(paths);
    expect(second.migrated).toBe(false);
    expect(second.notice).toBeUndefined();
  });
});
