import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { type AgentReleaseTarget, canonicalJson, sha256 } from './contracts';
import {
  type AgentArtifactReceipt,
  createReleaseManifest,
  verifySelfUseReleaseSet,
} from './publication';

describe('Agent release publication', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('aggregates only a complete validated self-use matrix', () => {
    const receipts = [
      receipt('darwin-arm64'),
      receipt('darwin-x64'),
      receipt('windows-x64'),
    ];
    const manifest = createReleaseManifest({
      minimumCliVersion: '0.1.0',
      provenance: 'self-use',
      receipts,
      releaseVersion: '0.0.12',
    });
    expect(manifest.artifacts.map((artifact) => artifact.target)).toEqual([
      'darwin-arm64',
      'darwin-x64',
      'windows-x64',
    ]);
    expect(manifest.provenance).toEqual({ kind: 'self-use', signed: false });
    expect(manifest).not.toHaveProperty('environmentCatalog');
    expect(manifest.artifacts[0].setupEntryPoint).toBe(
      'bin/cthutool-agent-setup',
    );
    expect(() =>
      createReleaseManifest({
        minimumCliVersion: '0.1.0',
        provenance: 'self-use',
        receipts: receipts.slice(1),
        releaseVersion: '0.0.12',
      }),
    ).toThrow(/missing a supported target/);
    expect(() =>
      createReleaseManifest({
        minimumCliVersion: '0.1.0',
        provenance: 'self-use',
        receipts: [
          {
            ...receipts[0],
            validation: { ...receipts[0].validation, cleanHostSmoke: false },
          },
          ...receipts.slice(1),
        ],
        releaseVersion: '0.0.12',
      }),
    ).toThrow(/clean-host smoke/);
    expect(() =>
      createReleaseManifest({
        minimumCliVersion: '0.1.0',
        provenance: 'self-use',
        receipts: [...receipts, receipts[0]],
        releaseVersion: '0.0.12',
      }),
    ).toThrow(/duplicate targets/);
  });

  test('keeps PR validation manifests unsigned and outside agent-latest', () => {
    const prReceipt = receipt('darwin-arm64', 'pull-request-validation');
    const manifest = createReleaseManifest({
      minimumCliVersion: '0.1.0',
      provenance: 'pull-request-validation',
      receipts: [prReceipt],
      releaseVersion: '0.0.0-pr.42.1',
    });
    expect(manifest.provenance.signed).toBe(false);
    expect(manifest.artifacts[0].archiveUrl).toContain('-unsigned-pr-');
    expect(manifest.artifacts[0].archiveUrl).not.toContain('/agent-latest/');
  });

  test('rejects signing claims and verifies archive digests without catalog', async () => {
    root = await mkdtemp('/tmp/ct-publish-');
    const receipts = [
      receipt('darwin-arm64'),
      receipt('darwin-x64'),
      receipt('windows-x64'),
    ];
    expect(() =>
      createReleaseManifest({
        minimumCliVersion: '0.1.0',
        provenance: 'self-use',
        receipts: [
          {
            ...receipts[0],
            validation: {
              cleanHostSmoke: true,
              notarizationStapled: true,
              platformSigned: false,
            },
          },
          ...receipts.slice(1),
        ],
        releaseVersion: '0.0.12',
      }),
    ).toThrow(/receipt contract is invalid|platform signing or notarization/);

    const manifest = createReleaseManifest({
      minimumCliVersion: '0.1.0',
      provenance: 'self-use',
      receipts,
      releaseVersion: '0.0.12',
    });
    const manifestPath = join(root, 'manifest.json');
    await writeFile(manifestPath, canonicalJson(manifest));
    for (const artifact of manifest.artifacts) {
      const archivePath = join(
        root,
        new URL(artifact.archiveUrl).pathname.split('/').at(-1) ?? '',
      );
      await writeFile(archivePath, Buffer.from('abc'));
    }

    await expect(
      verifySelfUseReleaseSet({
        archivesDir: root,
        manifestPath,
      }),
    ).resolves.toEqual(manifest);
    await writeFile(
      join(root, 'cthutool-agent-0.0.12-windows-x64.zip'),
      'tampered',
    );
    await expect(
      verifySelfUseReleaseSet({
        archivesDir: root,
        manifestPath,
      }),
    ).rejects.toThrow(/size or digest/);
  });
});

function receipt(
  target: AgentReleaseTarget,
  provenance: AgentArtifactReceipt['provenance'] = 'self-use',
): AgentArtifactReceipt {
  const windows = target === 'windows-x64';
  const prMarker =
    provenance === 'pull-request-validation' ? '-unsigned-pr-42' : '';
  const version =
    provenance === 'pull-request-validation' ? '0.0.0-pr.42.1' : '0.0.12';
  const archiveName = `cthutool-agent-${version}-${target}${prMarker}.zip`;
  const archiveUrl =
    provenance === 'pull-request-validation'
      ? `https://pr-validation.invalid/42/${version}/${archiveName}`
      : `https://github.com/example/CthuTool/releases/download/agent-latest/${archiveName}`;
  return {
    schemaVersion: 1,
    releaseVersion: version,
    provenance,
    artifact: {
      target,
      platform: windows ? 'windows' : 'darwin',
      architecture: target.endsWith('arm64') ? 'arm64' : 'x64',
      archiveUrl,
      archiveSize: 3,
      archiveSha256: sha256('abc'),
      trayEntryPoint: windows
        ? 'bin/cthutool-agent-tray.exe'
        : 'bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray',
      setupEntryPoint: windows
        ? 'bin/cthutool-agent-setup.exe'
        : 'bin/cthutool-agent-setup',
      nodeEntryPoint: windows
        ? 'runtime/node/node.exe'
        : 'runtime/node/bin/node',
      agentEntryPoint: 'agent/dist/index.js',
    },
    validation: {
      cleanHostSmoke: true,
      notarizationStapled: false,
      platformSigned: false,
    },
  };
}
