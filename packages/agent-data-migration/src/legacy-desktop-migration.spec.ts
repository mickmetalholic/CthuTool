import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  inspectLegacyDesktopMigration,
  type LegacyDesktopMigrationInput,
  legacyDesktopMigrationMarkerPath,
  migrateLegacyDesktopData,
  readLegacyDesktopMigrationStatus,
  resolveLegacyDesktopDataRoot,
} from './legacy-desktop-migration';

const production = {
  environmentId: 'production',
  backendHttpUrl: 'https://api.example.com',
  namespace: 'production',
} as const;
const staging = {
  environmentId: 'staging',
  backendHttpUrl: 'https://staging-api.example.com',
  namespace: 'staging',
} as const;

describe('legacy Electron Desktop data migration', () => {
  let temporaryRoot: string | undefined;

  afterEach(async () => {
    if (temporaryRoot) {
      await rm(temporaryRoot, { force: true, recursive: true });
      temporaryRoot = undefined;
    }
  });

  test('reports a fresh install without legacy data as absent', async () => {
    const input = await createInput();

    await expect(inspectLegacyDesktopMigration(input)).resolves.toMatchObject({
      status: 'absent',
      reason: 'legacy-data-absent',
    });
    expect(
      (await inspectLegacyDesktopMigration(input)) as Record<string, unknown>,
    ).not.toHaveProperty('secretRequired');
  });

  test('resolves the exact legacy Electron roots on macOS and Windows', () => {
    expect(
      resolveLegacyDesktopDataRoot({
        platform: 'darwin',
        homeDir: '/Users/tester',
      }),
    ).toBe('/Users/tester/Library/Application Support/CthuDesktop');
    expect(
      resolveLegacyDesktopDataRoot({
        platform: 'win32',
        homeDir: 'C:\\Users\\tester',
        env: { APPDATA: 'C:\\Users\\tester\\AppData\\Roaming' },
      }),
    ).toMatch(/CthuDesktop$/);
  });

  test('matches an exact trusted backend and migrates safe config plus multiple profiles', async () => {
    const input = await createInput();
    await writeLegacyConfig(input, {
      backendUrl: 'https://ignored.example.com',
      activeEnvironmentId: 'old-production',
      environmentProfiles: [
        {
          id: 'old-production',
          backendUrl: 'https://api.example.com/',
        },
      ],
      agentId: 'legacy-device-id-must-not-migrate',
      agentSecret: 'legacy-secret-must-not-migrate',
      deviceName: 'Migrated Mac',
      connectionEnabled: false,
      browserRuntime: { executablePath: '/Applications/Chrome' },
    });
    await writeProfile(input, 'douban/main/profile-meta.json', '{"ok":true}');
    await writeProfile(input, 'github/work/profile-meta.json', '{"ok":true}');
    const originalConfig = await readFile(
      join(input.legacyRootDir, 'config.json'),
      'utf8',
    );

    const result = await migrateLegacyDesktopData(input);

    expect(result).toMatchObject({
      status: 'migrated',
      environmentId: 'production',
      copiedProfileFiles: 2,
      configApplied: true,
    });
    expect(result).not.toHaveProperty('secretRequired');
    expect(result.retryCommand).toBeUndefined();
    const target = join(input.agentRootDir, 'environments', 'production');
    await expect(readJson(join(target, 'config.json'))).resolves.toEqual({
      deviceName: 'Migrated Mac',
      connectionEnabled: false,
      browserExecutablePath: '/Applications/Chrome',
    });
    await expect(
      readFile(
        join(target, 'browser-profiles/douban/main/profile-meta.json'),
        'utf8',
      ),
    ).resolves.toBe('{"ok":true}');
    await expect(stat(join(target, 'agent-secret'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(
      readFile(join(input.legacyRootDir, 'config.json'), 'utf8'),
    ).resolves.toBe(originalConfig);
    await expect(
      readFile(
        join(
          input.legacyRootDir,
          'browser-profiles/github/work/profile-meta.json',
        ),
        'utf8',
      ),
    ).resolves.toBe('{"ok":true}');
    const status = await readLegacyDesktopMigrationStatus(input.agentRootDir);
    expect(JSON.stringify(status)).not.toContain(
      'legacy-secret-must-not-migrate',
    );
    expect(JSON.stringify(status)).not.toContain(
      'legacy-device-id-must-not-migrate',
    );
  });

  test('requires explicit selection for ambiguous exact matches', async () => {
    const input = await createInput({
      environments: [
        production,
        {
          ...staging,
          backendHttpUrl: production.backendHttpUrl,
        },
      ],
    });
    await writeLegacyConfig(input, { backendUrl: production.backendHttpUrl });

    await expect(inspectLegacyDesktopMigration(input)).resolves.toMatchObject({
      status: 'selection-required',
      reason: 'legacy-backend-ambiguous',
      retryCommand: 'chc agent env list && chc agent env set <id>',
    });
  });

  test('does not guess when no trusted environment matches', async () => {
    const input = await createInput();
    await writeLegacyConfig(input, {
      backendUrl: 'https://retired.example.com',
    });

    await expect(migrateLegacyDesktopData(input)).resolves.toMatchObject({
      status: 'selection-required',
      reason: 'legacy-backend-unmatched',
    });
    await expect(
      stat(join(input.agentRootDir, 'environments', 'production')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('uses an explicit trusted environment after an unmatched backend', async () => {
    const input = await createInput({ explicitEnvironmentId: 'staging' });
    await writeLegacyConfig(input, {
      backendUrl: 'https://retired.example.com',
      deviceName: 'Old device',
    });

    await expect(migrateLegacyDesktopData(input)).resolves.toMatchObject({
      status: 'migrated',
      environmentId: 'staging',
    });
  });

  test('rejects an explicit development-only environment as untrusted', async () => {
    const input = await createInput({
      environments: [
        {
          environmentId: 'local',
          backendHttpUrl: 'http://localhost:3000',
          namespace: 'local',
          trust: 'custom-development',
        },
      ],
      explicitEnvironmentId: 'local',
    });
    await writeLegacyConfig(input, { backendUrl: 'http://localhost:3000' });

    await expect(inspectLegacyDesktopMigration(input)).resolves.toMatchObject({
      status: 'selection-required',
      reason: 'explicit-environment-untrusted-or-unknown',
    });
  });

  test('rejects malformed or insecure catalog entries before path resolution', async () => {
    const input = await createInput({
      environments: [
        {
          environmentId: 'production',
          backendHttpUrl: 'https://api.example.com',
          namespace: '../../outside',
        },
        {
          environmentId: 'insecure',
          backendHttpUrl: 'http://api.example.com',
          namespace: 'insecure',
        },
      ],
      explicitEnvironmentId: 'production',
    });
    await writeLegacyConfig(input, { backendUrl: 'https://api.example.com' });

    await expect(inspectLegacyDesktopMigration(input)).resolves.toMatchObject({
      status: 'selection-required',
      reason: 'explicit-environment-untrusted-or-unknown',
    });
    await expect(
      stat(join(input.agentRootDir, '..', 'outside')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('cleans an interrupted staging copy and succeeds on retry', async () => {
    const input = await createInput();
    await writeLegacyConfig(input, { backendUrl: production.backendHttpUrl });
    await writeProfile(input, 'douban/main/state.json', 'state');

    await expect(
      migrateLegacyDesktopData({
        ...input,
        hooks: {
          afterStaging: () => {
            throw new Error('simulated interruption');
          },
        },
      }),
    ).resolves.toMatchObject({ status: 'failed' });
    await expect(
      stat(
        join(
          input.agentRootDir,
          'environments/production/browser-profiles/douban/main/state.json',
        ),
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });

    await expect(migrateLegacyDesktopData(input)).resolves.toMatchObject({
      status: 'migrated',
    });
  });

  test('is idempotent after a completed migration', async () => {
    const input = await createInput();
    await writeLegacyConfig(input, { backendUrl: production.backendHttpUrl });
    await writeProfile(input, 'douban/main/state.json', 'state');

    await expect(migrateLegacyDesktopData(input)).resolves.toMatchObject({
      status: 'migrated',
    });
    await expect(migrateLegacyDesktopData(input)).resolves.toMatchObject({
      status: 'already-migrated',
      copiedProfileFiles: 1,
    });
    await expect(
      stat(legacyDesktopMigrationMarkerPath(input.agentRootDir, production)),
    ).resolves.toMatchObject({ mode: expect.any(Number) });
  });

  test('does not migrate while the target Agent profile lock is active', async () => {
    const input = await createInput();
    await writeLegacyConfig(input, { backendUrl: production.backendHttpUrl });
    const lockPath = join(
      input.agentRootDir,
      'environments/production/browser-profiles/.cthutool-agent.lock',
    );
    await mkdir(join(lockPath, '..'), { recursive: true });
    await writeFile(lockPath, JSON.stringify({ pid: process.pid }));

    await expect(migrateLegacyDesktopData(input)).resolves.toMatchObject({
      status: 'locked',
      reason: 'migration-active-lock',
    });
    await expect(
      stat(legacyDesktopMigrationMarkerPath(input.agentRootDir, production)),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('recovers stale profile and migration locks left by interrupted processes', async () => {
    const input = await createInput();
    await writeLegacyConfig(input, { backendUrl: production.backendHttpUrl });
    await writeProfile(input, 'douban/main/state.json', 'state');
    const environmentRoot = join(input.agentRootDir, 'environments/production');
    await mkdir(join(environmentRoot, 'browser-profiles'), { recursive: true });
    const stalePid = 2_147_483_647;
    await writeFile(
      join(environmentRoot, 'browser-profiles/.cthutool-agent.lock'),
      JSON.stringify({ pid: stalePid }),
    );
    await writeFile(
      join(environmentRoot, '.legacy-desktop-migration-v1.lock'),
      JSON.stringify({ pid: stalePid }),
    );

    await expect(migrateLegacyDesktopData(input)).resolves.toMatchObject({
      status: 'migrated',
      copiedProfileFiles: 1,
    });
  });

  async function createInput(
    overrides: Partial<LegacyDesktopMigrationInput> = {},
  ): Promise<LegacyDesktopMigrationInput> {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'cthutool-migration-'));
    return {
      agentRootDir: join(temporaryRoot, 'agent'),
      legacyRootDir: join(temporaryRoot, 'desktop'),
      environments: [production, staging],
      ...overrides,
    };
  }
});

async function writeLegacyConfig(
  input: LegacyDesktopMigrationInput,
  value: unknown,
) {
  await mkdir(input.legacyRootDir, { recursive: true });
  await writeFile(
    join(input.legacyRootDir, 'config.json'),
    `${JSON.stringify(value, null, 2)}\n`,
  );
}

async function writeProfile(
  input: LegacyDesktopMigrationInput,
  path: string,
  value: string,
) {
  const target = join(input.legacyRootDir, 'browser-profiles', path);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, value);
}

async function readJson(path: string) {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}
