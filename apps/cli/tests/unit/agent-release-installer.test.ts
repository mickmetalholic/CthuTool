import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
  type AgentReleaseManifest,
  type AgentReleaseTarget,
  canonicalJson,
  createBundleLayout,
  sha256,
} from '@cthutool/agent-release';
import { zipSync } from 'fflate';
import type { AgentPaths } from '../../src/infra/agent-paths';
import { installAgentRelease } from '../../src/infra/agent-release-installer';

describe('Agent self-use release installer', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) await rm(root, { force: true, recursive: true });
    root = undefined;
  });

  test('verifies, safely stages, activates, and idempotently reinstalls a self-use bundle', async () => {
    const fixture = createFixture();
    const paths = createPaths();
    let smokeUserDataDir: string | undefined;
    const dependencies = {
      architecture: 'arm64',
      cliVersion: '1.0.0',
      fetchBytes: fixture.fetchBytes,
      platform: 'darwin' as const,
      smoke: async (input: { readonly userDataDir: string }) => {
        smokeUserDataDir = input.userDataDir;
        return {
          applicationVersion: '0.0.12',
          bridgeEndpoint: 'http://127.0.0.1:1',
          bundledNodePath: '/fixture/node',
          environmentId: 'self-use',
          setupRequiredVerified: true,
        };
      },
    };

    await expect(
      installAgentRelease({
        dependencies,
        paths,
      }),
    ).resolves.toMatchObject({ changed: true, version: '0.0.12' });
    expect(smokeUserDataDir).toBeDefined();
    if (process.platform !== 'win32') {
      expect(`${smokeUserDataDir}/runtime/control.sock`.length).toBeLessThan(
        100,
      );
    }
    await expect(
      installAgentRelease({
        dependencies,
        paths,
      }),
    ).resolves.toMatchObject({ changed: false, version: '0.0.12' });
    expect(
      JSON.parse(
        await readFile(join(paths.installRoot, 'active.json'), 'utf8'),
      ),
    ).toMatchObject({ schemaVersion: 1, version: '0.0.12' });
    await writeFile(
      join(
        paths.installRoot,
        'versions',
        '0.0.12',
        'agent',
        'dist',
        'index.js',
      ),
      'tampered local runtime',
    );
    await expect(
      installAgentRelease({
        dependencies,
        paths,
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
          smoke: async () => {
            throw new Error('must not smoke a tampered archive');
          },
        },
        paths,
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
          smoke: async () => {
            throw new Error('must not smoke an unsafe archive');
          },
        },
        paths,
      }),
    ).rejects.toThrow(/unsafe agent archive path/i);
  });

  test('rejects an embedded deployment catalog in the archive inventory', async () => {
    const fixture = createFixture({ embedCatalog: true });
    const paths = createPaths();
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: fixture.fetchBytes,
          platform: 'darwin',
        },
        paths,
      }),
    ).rejects.toThrow(/deployment URL catalog|forbidden/i);
  });

  test('rejects legacy signed-channel manifests and unavailable latest releases', async () => {
    const paths = createPaths();
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: async () =>
            Buffer.from(
              canonicalJson({
                schemaVersion: 1,
                releaseVersion: '1.2.3',
                provenance: { kind: 'production', signed: true },
              }),
            ),
          platform: 'darwin',
        },
        paths,
      }),
    ).rejects.toThrow(/unsupported|self-use/i);
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: async () => {
            throw new Error('HTTP 404');
          },
          platform: 'darwin',
        },
        paths,
      }),
    ).rejects.toThrow(/latest agent release is unavailable/i);
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
        },
        paths,
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
    await writeFile(
      join(paths.userDataDir, 'config.json'),
      JSON.stringify({
        schemaVersion: 1,
        deploymentOrigin: 'https://keep.example.com',
      }),
    );
    await expect(
      installAgentRelease({
        dependencies: {
          architecture: 'arm64',
          cliVersion: '1.0.0',
          fetchBytes: fixture.fetchBytes,
          platform: 'darwin',
          smoke: async () => {
            throw new Error('simulated smoke interruption');
          },
        },
        paths,
      }),
    ).rejects.toThrow(/smoke interruption/i);
    await expect(
      stat(join(paths.installRoot, 'versions', '0.0.12')),
    ).rejects.toThrow();
    expect(
      JSON.parse(
        await readFile(join(paths.userDataDir, 'config.json'), 'utf8'),
      ),
    ).toMatchObject({ deploymentOrigin: 'https://keep.example.com' });
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
        },
        paths,
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
    readonly embedCatalog?: boolean;
    readonly unsafePath?: boolean;
  } = {},
) {
  const version = '0.0.12';
  const target: AgentReleaseTarget = 'darwin-arm64';
  const layout = createBundleLayout(target, version);
  const files: Record<string, Uint8Array> = {
    'layout.json': Buffer.from(canonicalJson(layout)),
    'agent/dist/index.js': Buffer.from('void 0;'),
    'agent/node_modules/playwright/package.json': Buffer.from('{}'),
    'agent/node_modules/playwright-core/package.json': Buffer.from('{}'),
    'licenses/NODE_LICENSE': Buffer.from('Node license'),
    'licenses/THIRD_PARTY_NOTICES.txt': Buffer.from('Notices'),
    'licenses/LICENSE-SLINT.md': Buffer.from('Slint license'),
    [layout.entryPoints.tray]: Buffer.from('tray'),
    [layout.entryPoints.setup]: Buffer.from('setup'),
    [layout.entryPoints.node]: Buffer.from('node'),
    'bin/CthuTool Agent.app/Contents/Info.plist': Buffer.from('<plist/>'),
  };
  if (options.embedCatalog) {
    files['agent/environments.json'] = Buffer.from('{"schemaVersion":1}');
  }
  if (options.unsafePath) files['../escaped'] = Buffer.from('escape');
  const archive = options.corruptArchive
    ? Buffer.from('not-a-zip')
    : zipSync(files, { level: 0 });
  const archiveUrl = `https://github.com/mickmetalholic/CthuTool/releases/download/agent-latest/cthutool-agent-${version}-${target}.zip`;
  const artifact = createArtifact(target, archiveUrl, archive, version);
  const placeholder = Buffer.from('placeholder');
  const manifest: AgentReleaseManifest = {
    schemaVersion: AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
    releaseVersion: version,
    minimumCliVersion: '0.0.0',
    layoutVersion: 1,
    protocols: {
      agentBackend: 1,
      agentControl: 1,
      localBridge: 1,
      trayControl: 1,
    },
    provenance: { kind: 'self-use', signed: false },
    artifacts: [
      artifact,
      createArtifact(
        'darwin-x64',
        `https://github.com/mickmetalholic/CthuTool/releases/download/agent-latest/cthutool-agent-${version}-darwin-x64.zip`,
        placeholder,
        version,
      ),
      createArtifact(
        'windows-x64',
        `https://github.com/mickmetalholic/CthuTool/releases/download/agent-latest/cthutool-agent-${version}-windows-x64.zip`,
        placeholder,
        version,
      ),
    ],
  };
  const manifestBytes = Buffer.from(canonicalJson(manifest));
  const manifestUrl =
    'https://github.com/mickmetalholic/CthuTool/releases/download/agent-latest/manifest.json';
  const responses = new Map<string, Uint8Array>([
    [manifestUrl, manifestBytes],
    [
      archiveUrl,
      options.tamperArchive
        ? Buffer.concat([archive, Buffer.from('tamper')])
        : archive,
    ],
  ]);
  return {
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
  version: string,
) {
  const layout = createBundleLayout(target, version);
  return {
    target,
    platform:
      target === 'windows-x64' ? ('windows' as const) : ('darwin' as const),
    architecture:
      target === 'darwin-arm64' ? ('arm64' as const) : ('x64' as const),
    archiveUrl,
    archiveSize: bytes.byteLength,
    archiveSha256: sha256(bytes),
    trayEntryPoint: layout.entryPoints.tray,
    setupEntryPoint: layout.entryPoints.setup,
    nodeEntryPoint: layout.entryPoints.node,
    agentEntryPoint: layout.entryPoints.agent,
  };
}
