import { afterEach, describe, expect, test } from 'bun:test';
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type AgentReleaseManifest,
  type AgentReleaseTarget,
  canonicalJson,
  createBundleLayout,
  sha256,
  signManifest,
  signReleaseBlob,
} from '@cthutool/agent-release';
import { zipSync } from 'fflate';
import type { AgentPaths } from '../../src/infra/agent-paths';
import { installAgentRelease } from '../../src/infra/agent-release-installer';

describe('Agent signed release installer', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) await rm(root, { force: true, recursive: true });
    root = undefined;
  });

  test('verifies, safely stages, activates, and idempotently reinstalls a production bundle', async () => {
    const fixture = createFixture();
    const paths = createPaths();
    const dependencies = {
      architecture: 'arm64',
      cliVersion: '1.0.0',
      fetchBytes: fixture.fetchBytes,
      platform: 'darwin' as const,
      publicKeyPem: fixture.publicKey,
      smoke: async () => ({
        applicationVersion: '1.2.3',
        bridgeEndpoint: 'http://127.0.0.1:1',
        bundledNodePath: '/fixture/node',
        environmentId: 'production',
      }),
    };

    await expect(
      installAgentRelease({
        dependencies,
        paths,
        version: '1.2.3',
      }),
    ).resolves.toMatchObject({ changed: true, version: '1.2.3' });
    await expect(
      installAgentRelease({
        dependencies,
        paths,
        version: '1.2.3',
      }),
    ).resolves.toMatchObject({ changed: false, version: '1.2.3' });
    expect(
      JSON.parse(
        await readFile(join(paths.installRoot, 'active.json'), 'utf8'),
      ),
    ).toMatchObject({ schemaVersion: 1, version: '1.2.3' });
    await writeFile(
      join(paths.installRoot, 'versions', '1.2.3', 'agent', 'dist', 'index.js'),
      'tampered local runtime',
    );
    await expect(
      installAgentRelease({
        dependencies,
        paths,
        version: '1.2.3',
      }),
    ).rejects.toThrow(/differs from the verified release/i);
  });

  test('fails closed for a tampered archive and leaves no active pointer', async () => {
    const fixture = createFixture({ tamperArchive: true });
    const paths = createPaths();
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: fixture.fetchBytes,
          platform: 'darwin',
          publicKeyPem: fixture.publicKey,
          smoke: async () => {
            throw new Error('must not smoke a tampered archive');
          },
        },
        paths,
        version: '1.2.3',
      }),
    ).rejects.toThrow(/digest|size|archive/i);
    await expect(
      readFile(join(paths.installRoot, 'active.json')),
    ).rejects.toThrow();
  });

  test('rejects path traversal before writing outside the staging root', async () => {
    const fixture = createFixture({ unsafePath: true });
    const paths = createPaths();
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: fixture.fetchBytes,
          platform: 'darwin',
          publicKeyPem: fixture.publicKey,
          smoke: async () => {
            throw new Error('must not smoke an unsafe archive');
          },
        },
        paths,
        version: '1.2.3',
      }),
    ).rejects.toThrow(/unsafe agent archive path/i);
  });

  test('rejects unsafe public catalog endpoints before extraction', async () => {
    const fixture = createFixture({ unsafeCatalog: true });
    const paths = createPaths();
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: fixture.fetchBytes,
          platform: 'darwin',
          publicKeyPem: fixture.publicKey,
        },
        paths,
        version: '1.2.3',
      }),
    ).rejects.toThrow(/https/i);
  });

  test('cleans up a corrupt extraction without activation', async () => {
    const fixture = createFixture({ corruptArchive: true });
    const paths = createPaths();
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: fixture.fetchBytes,
          platform: 'darwin',
          publicKeyPem: fixture.publicKey,
        },
        paths,
        version: '1.2.3',
      }),
    ).rejects.toThrow();
    await expect(
      readFile(join(paths.installRoot, 'active.json')),
    ).rejects.toThrow();
  });

  test('removes a newly staged version after smoke failure and preserves mutable data', async () => {
    const fixture = createFixture();
    const paths = createPaths();
    await mkdir(paths.userDataDir, { recursive: true });
    await writeFile(join(paths.userDataDir, 'environment.json'), 'preserve');
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: fixture.fetchBytes,
          platform: 'darwin',
          publicKeyPem: fixture.publicKey,
          smoke: async () => {
            throw new Error('simulated smoke interruption');
          },
        },
        paths,
        version: '1.2.3',
      }),
    ).rejects.toThrow(/smoke interruption/i);
    await expect(
      stat(join(paths.installRoot, 'versions', '1.2.3')),
    ).rejects.toThrow();
    expect(
      await readFile(join(paths.userDataDir, 'environment.json'), 'utf8'),
    ).toBe('preserve');
  });

  test('rejects unsupported platforms before any download', async () => {
    const paths = createPaths();
    let fetched = false;
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'x64',
          cliVersion: '1.0.0',
          fetchBytes: async () => {
            fetched = true;
            return new Uint8Array();
          },
          platform: 'linux',
          publicKeyPem: 'not-used',
        },
        paths,
        version: '1.2.3',
      }),
    ).rejects.toThrow(/supports macos/i);
    expect(fetched).toBe(false);
  });

  function createPaths(): AgentPaths {
    root = join(tmpdir(), `cthutool-cli-agent-${crypto.randomUUID()}`);
    return {
      installRoot: join(root, 'install'),
      logsDir: join(root, 'data', 'logs'),
      runtimeDir: join(root, 'data', 'runtime'),
      userDataDir: join(root, 'data'),
    };
  }
});

function createFixture(
  options: {
    readonly corruptArchive?: boolean;
    readonly tamperArchive?: boolean;
    readonly unsafeCatalog?: boolean;
    readonly unsafePath?: boolean;
  } = {},
) {
  const version = '1.2.3';
  const target: AgentReleaseTarget = 'darwin-arm64';
  const catalog = {
    schemaVersion: 1,
    profiles: [
      {
        environmentId: 'production',
        label: 'Production',
        webOrigin: options.unsafeCatalog
          ? 'http://app.example.com'
          : 'https://app.example.com',
        webAgentUrl: options.unsafeCatalog
          ? 'http://app.example.com/agent'
          : 'https://app.example.com/agent',
        backendHttpUrl: 'https://api.example.com',
        backendAgentWsUrl: 'wss://api.example.com/agent/ws',
        namespace: 'production',
      },
    ],
  };
  const catalogBytes = Buffer.from(canonicalJson(catalog));
  const layout = createBundleLayout(target, version);
  const files: Record<string, Uint8Array> = {
    'layout.json': Buffer.from(canonicalJson(layout)),
    'agent/dist/index.js': Buffer.from('void 0;'),
    'agent/environments.json': catalogBytes,
    'agent/node_modules/playwright/package.json': Buffer.from('{}'),
    'agent/node_modules/playwright-core/package.json': Buffer.from('{}'),
    'licenses/NODE_LICENSE': Buffer.from('Node license'),
    'licenses/THIRD_PARTY_NOTICES.txt': Buffer.from('Notices'),
    [layout.entryPoints.tray]: Buffer.from('tray'),
    [layout.entryPoints.node]: Buffer.from('node'),
    'bin/CthuTool Agent.app/Contents/Info.plist': Buffer.from('<plist/>'),
  };
  if (options.unsafePath) files['../escaped'] = Buffer.from('escape');
  const archive = options.corruptArchive
    ? Buffer.from('not-a-zip')
    : zipSync(files, { level: 0 });
  const archiveUrl = `https://releases.example.com/agent/${version}/cthutool-agent-${version}-${target}.zip`;
  const artifact = createArtifact(target, archiveUrl, archive);
  const placeholder = Buffer.from('placeholder');
  const manifest: AgentReleaseManifest = {
    schemaVersion: 1,
    releaseVersion: version,
    minimumCliVersion: '0.0.0',
    layoutVersion: 1,
    protocols: {
      agentBackend: 1,
      agentControl: 1,
      localBridge: 1,
      trayControl: 1,
    },
    environmentCatalog: { schemaVersion: 1, sha256: sha256(catalogBytes) },
    provenance: { kind: 'production', signed: true },
    artifacts: [
      artifact,
      createArtifact(
        'darwin-x64',
        `https://releases.example.com/agent/${version}/cthutool-agent-${version}-darwin-x64.zip`,
        placeholder,
      ),
      createArtifact(
        'windows-x64',
        `https://releases.example.com/agent/${version}/cthutool-agent-${version}-windows-x64.zip`,
        placeholder,
      ),
    ],
  };
  const keys = generateKeyPairSync('ed25519');
  const privateKey = keys.privateKey
    .export({ format: 'pem', type: 'pkcs8' })
    .toString();
  const publicKey = keys.publicKey
    .export({ format: 'pem', type: 'spki' })
    .toString();
  const manifestBytes = Buffer.from(canonicalJson(manifest));
  const manifestUrl =
    'https://github.com/mickmetalholic/CthuTool/releases/download/agent-v1.2.3/manifest.json';
  const responses = new Map<string, Uint8Array>([
    [manifestUrl, manifestBytes],
    [`${manifestUrl}.sig`, Buffer.from(signManifest(manifest, privateKey))],
    [
      'https://releases.example.com/agent/1.2.3/environments.json',
      catalogBytes,
    ],
    [
      archiveUrl,
      options.tamperArchive
        ? Buffer.concat([archive, Buffer.from('tamper')])
        : archive,
    ],
    [`${archiveUrl}.sig`, Buffer.from(signReleaseBlob(archive, privateKey))],
  ]);
  return {
    publicKey,
    fetchBytes: async (url: string) => {
      const value = responses.get(url);
      if (!value) throw new Error(`Unexpected fixture URL: ${url}`);
      return value;
    },
  };
}

function createArtifact(
  target: AgentReleaseTarget,
  archiveUrl: string,
  bytes: Uint8Array,
) {
  const layout = createBundleLayout(target, '1.2.3');
  return {
    target,
    platform:
      target === 'windows-x64' ? ('windows' as const) : ('darwin' as const),
    architecture:
      target === 'darwin-arm64' ? ('arm64' as const) : ('x64' as const),
    archiveUrl,
    archiveSize: bytes.byteLength,
    archiveSha256: sha256(bytes),
    archiveSignatureUrl: `${archiveUrl}.sig`,
    trayEntryPoint: layout.entryPoints.tray,
    nodeEntryPoint: layout.entryPoints.node,
    agentEntryPoint: layout.entryPoints.agent,
    platformSignature: {
      required: true as const,
      notarizationRequired: target !== 'windows-x64',
    },
  };
}
