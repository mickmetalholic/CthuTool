import { describe, expect, test } from 'vitest';
import {
  AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
  type AgentReleaseManifest,
  type AgentReleaseTarget,
  type AgentReleaseValidationError,
  assertArchiveBinding,
  assertCliCompatibility,
  assertSelfUseCatalogConfigured,
  assertSelfUseProvenance,
  canonicalJson,
  selectReleaseArtifact,
  sha256,
  validateEnvironmentCatalog,
  validateReleaseManifest,
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
    archiveUrl: `https://github.com/example/CthuTool/releases/download/agent-latest/cthutool-agent-0.0.12-${target}.zip`,
    archiveSize: 3,
    archiveSha256: sha256('abc'),
    trayEntryPoint: windows
      ? 'bin/cthutool-agent-tray.exe'
      : 'bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray',
    setupEntryPoint: windows
      ? 'bin/cthutool-agent-setup.exe'
      : 'bin/cthutool-agent-setup',
    nodeEntryPoint: windows ? 'runtime/node/node.exe' : 'runtime/node/bin/node',
    agentEntryPoint: 'agent/dist/index.js',
  };
}

function manifest(): AgentReleaseManifest {
  return {
    schemaVersion: AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
    releaseVersion: '0.0.12',
    minimumCliVersion: '0.1.0',
    layoutVersion: 1,
    protocols: {
      agentBackend: 1,
      agentControl: 1,
      localBridge: 1,
      trayControl: 1,
    },
    provenance: { kind: 'self-use', signed: false },
    artifacts: [
      artifact('darwin-arm64'),
      artifact('darwin-x64'),
      artifact('windows-x64'),
    ],
  };
}

describe('Agent release contracts', () => {
  test('accepts exact non-secret HTTPS/WSS catalog entries for development tooling', () => {
    expect(validateEnvironmentCatalog(catalog)).toEqual(catalog);
  });

  test('rejects placeholder origins for development catalog publication helpers', () => {
    expect(() =>
      assertSelfUseCatalogConfigured(validateEnvironmentCatalog(catalog)),
    ).toThrow(/placeholders are not publishable/i);
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

  test('validates complete self-use matrix without catalog binding', () => {
    expect(validateReleaseManifest(manifest())).toEqual(manifest());
    expect(() => assertSelfUseProvenance(manifest())).not.toThrow();
    expect(() =>
      validateReleaseManifest({ ...manifest(), schemaVersion: 2 }),
    ).toThrowError(
      expect.objectContaining<Partial<AgentReleaseValidationError>>({
        code: 'INCOMPATIBLE_SCHEMA',
      }),
    );
    expect(() =>
      validateReleaseManifest({ ...manifest(), schemaVersion: 99 }),
    ).toThrowError(
      expect.objectContaining<Partial<AgentReleaseValidationError>>({
        code: 'INCOMPATIBLE_SCHEMA',
      }),
    );
    expect(() =>
      validateReleaseManifest({
        ...manifest(),
        provenance: { kind: 'production', signed: true },
      }),
    ).toThrow(/provenance is invalid/);
    expect(() =>
      validateReleaseManifest({
        ...manifest(),
        environmentCatalog: { schemaVersion: 1, sha256: '0'.repeat(64) },
      }),
    ).toThrow(/must not bind a deployment URL catalog|unknown or missing/);
  });

  test('rejects signature fields and missing integrity metadata', () => {
    expect(() =>
      validateReleaseManifest({
        ...manifest(),
        artifacts: manifest().artifacts.map((value) => ({
          ...value,
          archiveSignatureUrl: `${value.archiveUrl}.sig`,
        })),
      }),
    ).toThrow(/unknown or missing fields|must not declare/);
    expect(() =>
      validateReleaseManifest({
        ...manifest(),
        artifacts: manifest().artifacts.map(
          ({ archiveSha256: _ignored, ...value }) => value,
        ),
      }),
    ).toThrow(/unknown or missing fields/);
    expect(() =>
      validateReleaseManifest({
        ...manifest(),
        artifacts: [
          {
            ...manifest().artifacts[0],
            archiveUrl: 'http://insecure.example.com/agent.zip',
          },
          ...manifest().artifacts.slice(1),
        ],
      }),
    ).toThrow(/HTTPS/);
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

  test('binds archive bytes without catalog digests', () => {
    const value = manifest();
    expect(() =>
      assertArchiveBinding(value.artifacts[0], Buffer.from('abc')),
    ).not.toThrow();
    expect(() =>
      assertArchiveBinding(value.artifacts[0], Buffer.from('bad')),
    ).toThrow(/size or digest/);
    expect(canonicalJson({ z: 1, a: { y: 2, b: 3 } })).toBe(
      '{"a":{"b":3,"y":2},"z":1}\n',
    );
  });

  test('keeps unsigned PR artifacts unreachable from self-use manifests', () => {
    expect(() =>
      validateReleaseManifest({
        ...manifest(),
        artifacts: manifest().artifacts.map((value) => ({
          ...value,
          archiveUrl: value.archiveUrl.replace('.zip', '-unsigned-pr-42.zip'),
        })),
      }),
    ).toThrow(/cannot reference pull-request|versioned target archive/);
  });
});
