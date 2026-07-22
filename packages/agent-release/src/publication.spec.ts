import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  type AgentReleaseTarget,
  canonicalJson,
  sha256,
  signManifest,
  signReleaseBlob,
} from './contracts';
import {
  type AgentArtifactReceipt,
  createChannelPointer,
  createReleaseManifest,
  verifyProductionReleaseSet,
} from './publication';

const catalogBytes = Buffer.from(
  canonicalJson({
    schemaVersion: 1,
    profiles: [
      {
        environmentId: 'production',
        label: 'Production',
        webOrigin: 'https://app.example.com',
        webAgentUrl: 'https://app.example.com/agent',
        backendHttpUrl: 'https://api.example.com',
        backendAgentWsUrl: 'wss://api.example.com/ws/agents',
        namespace: 'production',
      },
    ],
  }),
);

describe('Agent release publication', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('aggregates only a complete validated production matrix', () => {
    const receipts = [
      receipt('darwin-arm64'),
      receipt('darwin-x64'),
      receipt('windows-x64'),
    ];
    const manifest = createReleaseManifest({
      catalogBytes,
      minimumCliVersion: '0.1.0',
      provenance: 'production',
      receipts,
      releaseVersion: '1.2.3',
    });
    expect(manifest.artifacts.map((artifact) => artifact.target)).toEqual([
      'darwin-arm64',
      'darwin-x64',
      'windows-x64',
    ]);
    expect(manifest.environmentCatalog.sha256).toBe(sha256(catalogBytes));
    expect(() =>
      createReleaseManifest({
        catalogBytes,
        minimumCliVersion: '0.1.0',
        provenance: 'production',
        receipts: receipts.slice(1),
        releaseVersion: '1.2.3',
      }),
    ).toThrow(/missing a supported target/);
    expect(() =>
      createReleaseManifest({
        catalogBytes,
        minimumCliVersion: '0.1.0',
        provenance: 'production',
        receipts: [
          {
            ...receipts[0],
            validation: { ...receipts[0].validation, cleanHostSmoke: false },
          },
          ...receipts.slice(1),
        ],
        releaseVersion: '1.2.3',
      }),
    ).toThrow(/clean-host smoke/);
    expect(() =>
      createReleaseManifest({
        catalogBytes,
        minimumCliVersion: '0.1.0',
        provenance: 'production',
        receipts: [...receipts, receipts[0]],
        releaseVersion: '1.2.3',
      }),
    ).toThrow(/duplicate targets/);
  });

  test('keeps PR validation manifests unsigned and outside channels', () => {
    const prReceipt = receipt('darwin-arm64', 'pull-request-validation');
    const manifest = createReleaseManifest({
      catalogBytes,
      minimumCliVersion: '0.1.0',
      provenance: 'pull-request-validation',
      receipts: [prReceipt],
      releaseVersion: '1.2.3',
    });
    expect(manifest.provenance.signed).toBe(false);
    expect(manifest.artifacts[0].archiveUrl).toContain('-unsigned-pr-');
    expect(() =>
      createChannelPointer({
        channel: 'stable',
        manifest,
        manifestUrl: 'https://releases.example.com/agent/1.2.3/manifest.json',
      }),
    ).toThrow(/cannot point/);
  });

  test('verifies the signed manifest, catalog, every archive digest and signature', async () => {
    root = await mkdtemp('/tmp/ct-publish-');
    const receipts = [
      receipt('darwin-arm64'),
      receipt('darwin-x64'),
      receipt('windows-x64'),
    ];
    const manifest = createReleaseManifest({
      catalogBytes,
      minimumCliVersion: '0.1.0',
      provenance: 'production',
      receipts,
      releaseVersion: '1.2.3',
    });
    const keys = generateKeyPairSync('ed25519', {
      privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
      publicKeyEncoding: { format: 'pem', type: 'spki' },
    });
    const manifestPath = join(root, 'manifest.json');
    const manifestSignaturePath = `${manifestPath}.sig`;
    const catalogPath = join(root, 'environments.json');
    await writeFile(manifestPath, canonicalJson(manifest));
    await writeFile(
      manifestSignaturePath,
      `${signManifest(manifest, keys.privateKey)}\n`,
    );
    await writeFile(catalogPath, catalogBytes);
    for (const artifact of manifest.artifacts) {
      const archivePath = join(
        root,
        new URL(artifact.archiveUrl).pathname.split('/').at(-1) ?? '',
      );
      const bytes = Buffer.from('abc');
      await writeFile(archivePath, bytes);
      await writeFile(
        `${archivePath}.sig`,
        `${signReleaseBlob(bytes, keys.privateKey)}\n`,
      );
    }

    await expect(
      verifyProductionReleaseSet({
        archivesDir: root,
        catalogPath,
        manifestPath,
        manifestSignaturePath,
        publicKeyPem: keys.publicKey,
      }),
    ).resolves.toEqual(manifest);
    await writeFile(
      join(root, 'cthutool-agent-1.2.3-windows-x64.zip'),
      'tampered',
    );
    await expect(
      verifyProductionReleaseSet({
        archivesDir: root,
        catalogPath,
        manifestPath,
        manifestSignaturePath,
        publicKeyPem: keys.publicKey,
      }),
    ).rejects.toThrow(/size or digest/);
  });
});

function receipt(
  target: AgentReleaseTarget,
  provenance: AgentArtifactReceipt['provenance'] = 'production',
): AgentArtifactReceipt {
  const windows = target === 'windows-x64';
  const prMarker =
    provenance === 'pull-request-validation' ? '-unsigned-pr-42' : '';
  const archiveName = `cthutool-agent-1.2.3-${target}${prMarker}.zip`;
  return {
    schemaVersion: 1,
    releaseVersion: '1.2.3',
    provenance,
    artifact: {
      target,
      platform: windows ? 'windows' : 'darwin',
      architecture: target.endsWith('arm64') ? 'arm64' : 'x64',
      archiveUrl: `https://releases.example.com/agent/1.2.3/${archiveName}`,
      archiveSize: 3,
      archiveSha256: sha256('abc'),
      archiveSignatureUrl: `https://releases.example.com/agent/1.2.3/${archiveName}.sig`,
      trayEntryPoint: windows
        ? 'bin/cthutool-agent-tray.exe'
        : 'bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray',
      nodeEntryPoint: windows
        ? 'runtime/node/node.exe'
        : 'runtime/node/bin/node',
      agentEntryPoint: 'agent/dist/index.js',
      platformSignature: {
        required: true,
        notarizationRequired: !windows,
      },
    },
    validation: {
      cleanHostSmoke: true,
      notarizationStapled: !windows,
      platformSigned: true,
    },
  };
}
