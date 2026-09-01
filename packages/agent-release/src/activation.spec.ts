import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  activateVersion,
  readActiveVersion,
  rollbackActiveVersion,
  stageVersion,
} from './activation';
import { createBundleLayout } from './layout';

describe('version staging and activation', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('stages complete immutable version and keeps mutable data external', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-activation-'));
    const extracted = await createExtractedFixture(root, '1.2.3');
    const mutableConfig = join(
      root,
      'install',
      'environments/prod/config.json',
    );
    await mkdir(join(root, 'install', 'environments/prod'), {
      recursive: true,
    });
    await writeFile(mutableConfig, '{"deviceName":"Outside version"}\n');

    const versionRoot = await stageVersion({
      installRoot: join(root, 'install'),
      extractedRoot: extracted,
      target: 'darwin-arm64',
      version: '1.2.3',
    });

    expect(versionRoot).toBe(join(root, 'install', 'versions', '1.2.3'));
    expect(await readFile(mutableConfig, 'utf8')).toBe(
      '{"deviceName":"Outside version"}\n',
    );

    expect(
      await stageVersion({
        installRoot: join(root, 'install'),
        extractedRoot: extracted,
        target: 'darwin-arm64',
        version: '1.2.3',
      }),
    ).toBe(versionRoot);
  });

  test('partial extraction never becomes a version', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-activation-'));
    const partial = join(root, 'partial');
    await mkdir(partial);
    await writeFile(join(partial, 'layout.json'), '{}');

    await expect(
      stageVersion({
        installRoot: join(root, 'install'),
        extractedRoot: partial,
        target: 'darwin-arm64',
        version: '1.2.3',
      }),
    ).rejects.toThrow(/missing/);
    await expect(
      readFile(join(root, 'install', 'versions', '1.2.3', 'layout.json')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('failed activation preserves previous pointer and supports rollback', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-activation-'));
    const installRoot = join(root, 'install');
    const first = await createExtractedFixture(root, '1.0.0');
    const second = join(root, 'extracted-2.0.0');
    await cp(first, second, { recursive: true });
    await stageVersion({
      installRoot,
      extractedRoot: first,
      target: 'darwin-arm64',
      version: '1.0.0',
    });
    await stageVersion({
      installRoot,
      extractedRoot: second,
      target: 'darwin-arm64',
      version: '2.0.0',
    });
    await activateVersion({
      installRoot,
      version: '1.0.0',
      smokeCheck: vi.fn(async () => undefined),
      now: () => new Date('2026-07-22T00:00:00.000Z'),
    });

    await expect(
      activateVersion({
        installRoot,
        version: '2.0.0',
        smokeCheck: vi.fn(async () => {
          throw new Error('readiness failed');
        }),
      }),
    ).rejects.toThrow('readiness failed');
    expect((await readActiveVersion(installRoot))?.version).toBe('1.0.0');

    await activateVersion({
      installRoot,
      version: '2.0.0',
      smokeCheck: vi.fn(async () => undefined),
    });
    expect((await readActiveVersion(installRoot))?.version).toBe('2.0.0');
    expect(
      (
        await rollbackActiveVersion({
          installRoot,
          smokeCheck: vi.fn(async () => undefined),
        })
      ).version,
    ).toBe('1.0.0');
  });
});

async function createExtractedFixture(root: string, version: string) {
  const extracted = join(root, `extracted-${version}`);
  const layout = createBundleLayout('darwin-arm64', version);
  const paths = [
    'layout.json',
    layout.entryPoints.tray,
    layout.entryPoints.setup,
    layout.entryPoints.node,
    layout.entryPoints.agent,
    'agent/node_modules/playwright/package.json',
    'agent/node_modules/playwright-core/package.json',
    'licenses/NODE_LICENSE',
    'licenses/THIRD_PARTY_NOTICES.txt',
    'licenses/LICENSE-SLINT.md',
    'bin/CthuTool Agent.app/Contents/Info.plist',
  ];
  for (const path of paths) {
    const destination = join(extracted, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(
      destination,
      path === 'layout.json' ? JSON.stringify(layout) : path,
    );
  }
  return extracted;
}
