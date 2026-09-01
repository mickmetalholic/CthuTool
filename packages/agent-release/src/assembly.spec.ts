import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { afterEach, describe, expect, test } from 'vitest';
import {
  archiveBundleDirectory,
  assembleAgentBundle,
  releaseTargetFromPlatform,
} from './assembly';

describe('Agent bundle assembly', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('assembles deterministic unsigned PR archive from pinned inputs', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-release-'));
    const fixture = await createFixture(root);
    const input = {
      ...fixture,
      target: 'darwin-arm64' as const,
      releaseVersion: '0.0.0-pr.123.1',
      pullRequestMarker: '123-1',
    };

    const first = await assembleAgentBundle(input);
    const firstBytes = await readFile(first.archivePath);
    const second = await assembleAgentBundle({
      ...input,
      outputDir: join(root, 'second'),
    });
    const secondBytes = await readFile(second.archivePath);

    expect(first.archiveName).toContain('-unsigned-pr-123-1.zip');
    expect(first.archiveSha256).toBe(second.archiveSha256);
    expect(firstBytes).toEqual(secondBytes);
    expect(Object.keys(unzipSync(firstBytes))).toEqual(first.inventory);
    expect(first.inventory).toEqual(
      expect.arrayContaining([
        'bin/cthutool-agent-setup',
        'licenses/LICENSE-SLINT.md',
      ]),
    );
    expect(first.inventory).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /electron|renderer|\.html$|\.css$|environments\.json/i,
        ),
      ]),
    );

    const stageDir = join(root, 'stage');
    const staged = await assembleAgentBundle({
      ...input,
      outputDir: join(root, 'staged-out'),
      stageDir,
    });
    await writeFile(
      join(stageDir, 'agent/dist/index.js'),
      'updated-agent();\n',
    );
    const republished = await archiveBundleDirectory({
      outputDir: join(root, 'republished-out'),
      releaseVersion: input.releaseVersion,
      stageDir,
      target: input.target,
    });
    expect(republished.archiveSha256).not.toBe(staged.archiveSha256);
  });

  test('assembles versioned self-use archives without unsigned-pr markers', async () => {
    root = await mkdtemp(join(tmpdir(), 'cthutool-release-'));
    const fixture = await createFixture(root);
    const result = await assembleAgentBundle({
      ...fixture,
      target: 'darwin-arm64',
      releaseVersion: '0.0.12',
    });
    expect(result.archiveName).toBe('cthutool-agent-0.0.12-darwin-arm64.zip');
    expect(result.archiveName).not.toContain('-unsigned-pr-');
  });

  test('encodes only the supported release matrix', () => {
    expect(releaseTargetFromPlatform('darwin', 'arm64')).toBe('darwin-arm64');
    expect(releaseTargetFromPlatform('darwin', 'x64')).toBe('darwin-x64');
    expect(releaseTargetFromPlatform('win32', 'x64')).toBe('windows-x64');
    expect(releaseTargetFromPlatform('linux', 'x64')).toBeUndefined();
  });
});

async function createFixture(root: string) {
  const deployedAgentDir = join(root, 'deployed-agent');
  const outputDir = join(root, 'out');
  await mkdir(join(deployedAgentDir, 'dist'), { recursive: true });
  await mkdir(join(deployedAgentDir, 'node_modules/playwright'), {
    recursive: true,
  });
  await mkdir(join(deployedAgentDir, 'node_modules/playwright-core'), {
    recursive: true,
  });
  await mkdir(join(deployedAgentDir, 'node_modules/.pnpm/node_modules'), {
    recursive: true,
  });
  await writeFile(
    join(deployedAgentDir, 'package.json'),
    '{"name":"@cthutool/agent"}\n',
  );
  await writeFile(join(deployedAgentDir, 'dist/index.js'), 'agent();\n');
  await writeFile(
    join(deployedAgentDir, 'node_modules/playwright/package.json'),
    '{"name":"playwright"}\n',
  );
  await writeFile(
    join(deployedAgentDir, 'node_modules/playwright-core/package.json'),
    '{"name":"playwright-core"}\n',
  );
  const trayExecutablePath = join(root, 'tray');
  const setupExecutablePath = join(root, 'setup');
  const nodeExecutablePath = join(root, 'node');
  const nodeLicensePath = join(root, 'NODE_LICENSE');
  const thirdPartyNoticesPath = join(root, 'THIRD_PARTY_NOTICES.txt');
  const slintLicensePath = join(root, 'LICENSE-SLINT.md');
  await writeFile(trayExecutablePath, 'tray');
  await writeFile(setupExecutablePath, 'setup');
  await writeFile(nodeExecutablePath, 'node');
  await writeFile(nodeLicensePath, 'Node license');
  await writeFile(thirdPartyNoticesPath, 'Notices');
  await writeFile(slintLicensePath, 'Slint license');
  return {
    trayExecutablePath,
    setupExecutablePath,
    nodeExecutablePath,
    nodeLicensePath,
    deployedAgentDir,
    thirdPartyNoticesPath,
    slintLicensePath,
    outputDir,
  };
}
