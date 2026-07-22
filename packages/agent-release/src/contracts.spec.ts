import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import {
  AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
  type AgentReleaseManifest,
  type AgentReleaseTarget,
  type AgentReleaseValidationError,
  assertArchiveBinding,
  assertCatalogBinding,
  assertCliCompatibility,
  canonicalJson,
  selectReleaseArtifact,
  sha256,
  signManifest,
  signReleaseBlob,
  validateChannelPointer,
  validateEnvironmentCatalog,
  validateReleaseManifest,
  verifyManifestSignature,
  verifyReleaseBlobSignature,
} from './contracts';

const catalog = {
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
};

function artifact(target: AgentReleaseTarget) {
  const [platform, architecture] = target.split('-') as [
    'darwin' | 'windows',
    'arm64' | 'x64',
  ];
  const windows = platform === 'windows';
  return {
    target,
    platform,
    architecture,
    archiveUrl: `https://releases.example.com/agent/1.2.3/cthutool-agent-1.2.3-${target}.zip`,
    archiveSize: 3,
    archiveSha256: sha256('abc'),
    archiveSignatureUrl: `https://releases.example.com/agent/1.2.3/cthutool-agent-1.2.3-${target}.zip.sig`,
    trayEntryPoint: windows
      ? 'bin/cthutool-agent-tray.exe'
      : 'bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray',
    nodeEntryPoint: windows ? 'runtime/node/node.exe' : 'runtime/node/bin/node',
    agentEntryPoint: 'agent/dist/index.js',
    platformSignature: {
      required: true as const,
      notarizationRequired: !windows,
    },
  };
}

function manifest(): AgentReleaseManifest {
  const catalogBytes = Buffer.from(`${JSON.stringify(catalog)}\n`);
  return {
    schemaVersion: AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
    releaseVersion: '1.2.3',
    minimumCliVersion: '0.1.0',
    layoutVersion: 1,
    protocols: {
      agentBackend: 1,
      agentControl: 1,
      localBridge: 1,
      trayControl: 1,
    },
    environmentCatalog: {
      schemaVersion: 1,
      sha256: sha256(catalogBytes),
    },
    provenance: { kind: 'production', signed: true },
    artifacts: [
      artifact('darwin-arm64'),
      artifact('darwin-x64'),
      artifact('windows-x64'),
    ],
  };
}

describe('Agent release contracts', () => {
  test('accepts exact non-secret HTTPS/WSS catalog entries', () => {
    expect(validateEnvironmentCatalog(catalog)).toEqual(catalog);
  });

  test('rejects catalog secrets, duplicate ids, and cross-origin console URLs', () => {
    expect(() =>
      validateEnvironmentCatalog({
        ...catalog,
        profiles: [{ ...catalog.profiles[0], agentSecret: 'leak' }],
      }),
    ).toThrow(/unknown or missing fields/);
    expect(() =>
      validateEnvironmentCatalog({
        ...catalog,
        profiles: [
          catalog.profiles[0],
          { ...catalog.profiles[0], namespace: 'other' },
        ],
      }),
    ).toThrow(/unique/);
    expect(() =>
      validateEnvironmentCatalog({
        ...catalog,
        profiles: [
          {
            ...catalog.profiles[0],
            webAgentUrl: 'https://evil.example.com/agent',
          },
        ],
      }),
    ).toThrow(/same-origin/);
  });

  test('validates complete production matrix and rejects unknown schema', () => {
    expect(validateReleaseManifest(manifest())).toEqual(manifest());
    expect(() =>
      validateReleaseManifest({ ...manifest(), schemaVersion: 99 }),
    ).toThrowError(
      expect.objectContaining<Partial<AgentReleaseValidationError>>({
        code: 'INCOMPATIBLE_SCHEMA',
      }),
    );
  });

  test('fails before download for unsupported target or old CLI', () => {
    const value = manifest();
    expect(() => selectReleaseArtifact(value, 'linux-x64')).toThrowError(
      expect.objectContaining<Partial<AgentReleaseValidationError>>({
        code: 'UNSUPPORTED_TARGET',
      }),
    );
    expect(() => assertCliCompatibility(value, '0.0.9')).toThrowError(
      expect.objectContaining<Partial<AgentReleaseValidationError>>({
        code: 'INCOMPATIBLE_CLI',
      }),
    );
  });

  test('binds manifest signature, archive bytes, and exact catalog bytes', () => {
    const keys = generateKeyPairSync('ed25519', {
      privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
      publicKeyEncoding: { format: 'pem', type: 'spki' },
    });
    const value = manifest();
    const signature = signManifest(value, keys.privateKey);
    const archiveSignature = signReleaseBlob(
      Buffer.from('abc'),
      keys.privateKey,
    );

    expect(() =>
      verifyManifestSignature(value, signature, keys.publicKey),
    ).not.toThrow();
    expect(() =>
      verifyManifestSignature(
        { ...value, releaseVersion: '1.2.4' },
        signature,
        keys.publicKey,
      ),
    ).toThrowError(/signature is invalid/);
    expect(() =>
      assertArchiveBinding(value.artifacts[0], Buffer.from('abc')),
    ).not.toThrow();
    expect(() =>
      assertArchiveBinding(value.artifacts[0], Buffer.from('bad')),
    ).toThrow(/size or digest/);
    expect(() =>
      verifyReleaseBlobSignature(
        Buffer.from('abc'),
        archiveSignature,
        keys.publicKey,
      ),
    ).not.toThrow();
    expect(() =>
      verifyReleaseBlobSignature(
        Buffer.from('tampered'),
        archiveSignature,
        keys.publicKey,
      ),
    ).toThrow(/blob signature/);
    const catalogBytes = Buffer.from(`${JSON.stringify(catalog)}\n`);
    expect(assertCatalogBinding(value, catalogBytes)).toEqual(catalog);
    expect(() =>
      assertCatalogBinding(
        value,
        Buffer.from(`${JSON.stringify({ ...catalog, x: 1 })}\n`),
      ),
    ).toThrow();
  });

  test('keeps unsigned PR artifacts unreachable from production manifests', () => {
    expect(() =>
      validateReleaseManifest({
        ...manifest(),
        artifacts: manifest().artifacts.map((value) => ({
          ...value,
          archiveUrl: value.archiveUrl.replace('.zip', '-unsigned-pr-42.zip'),
        })),
      }),
    ).toThrow(/cannot reference pull-request/);
  });

  test('validates immutable channel pointers and deterministic JSON', () => {
    expect(
      validateChannelPointer({
        schemaVersion: 1,
        channel: 'stable',
        releaseVersion: '1.2.3',
        manifestUrl: 'https://releases.example.com/agent/1.2.3/manifest.json',
        manifestSha256: sha256('manifest'),
      }),
    ).toMatchObject({ channel: 'stable', releaseVersion: '1.2.3' });
    expect(() =>
      validateChannelPointer({
        schemaVersion: 1,
        channel: 'stable',
        releaseVersion: '1.2.3',
        manifestUrl: 'https://releases.example.com/agent/latest/manifest.json',
        manifestSha256: sha256('manifest'),
      }),
    ).toThrow(/immutable/);
    expect(canonicalJson({ z: 1, a: { y: 2, b: 3 } })).toBe(
      '{"a":{"b":3,"y":2},"z":1}\n',
    );
  });
});
