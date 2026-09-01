import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { canonicalJson } from './contracts';
import { createBundleLayout } from './layout';
import { AgentBundleSmokeError, smokeExtractedAgentBundle } from './smoke';

describe('clean-host Agent bundle smoke', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('fresh archive reaches SetupRequired without crash loop', async () => {
    root = await mkdtemp('/tmp/ct-smoke-');
    const bundleRoot = join(root, 'bundle');
    await materializeBundle(bundleRoot, FAKE_AGENT);
    const result = await smokeExtractedAgentBundle({
      bundleRoot: relative(process.cwd(), bundleRoot),
      timeoutMs: 10_000,
      userDataDir: relative(process.cwd(), join(root, 'user-data-fresh')),
    });
    expect(result).toMatchObject({
      applicationVersion: '1.2.3',
      environmentId: 'self-use',
      setupRequiredVerified: true,
    });
  }, 15_000);

  test('configured archive uses bundled Node and retries control health and environment switching', async () => {
    root = await mkdtemp('/tmp/ct-smoke-');
    const bundleRoot = join(root, 'bundle');
    await materializeBundle(bundleRoot, FAKE_AGENT);
    const bundledNode = join(
      bundleRoot,
      ...createBundleLayout('darwin-arm64', '1.2.3').entryPoints.node.split(
        '/',
      ),
    );
    const result = await smokeExtractedAgentBundle({
      bundleRoot: relative(process.cwd(), bundleRoot),
      deploymentOrigin: 'https://app.example.com',
      environment: {
        CTHUTOOL_SMOKE_CONTROL_DELAY_MS: '250',
        CTHUTOOL_SMOKE_HEALTH_DELAY_MS: '750',
        CTHUTOOL_SMOKE_SWITCH_DELAY_MS: '5100',
      },
      timeoutMs: 10_000,
      userDataDir: relative(process.cwd(), join(root, 'user-data-configured')),
    });
    expect(result).toMatchObject({
      applicationVersion: '1.2.3',
      bundledNodePath: await realpath(bundledNode),
      environmentId: 'self-use',
      setupRequiredVerified: false,
    });
  }, 15_000);

  test('launches the native setup smoke entrypoint when requested', async () => {
    root = await mkdtemp('/tmp/ct-smoke-');
    const bundleRoot = join(root, 'bundle');
    await materializeBundle(bundleRoot, FAKE_AGENT);
    const setupPath = join(
      bundleRoot,
      ...createBundleLayout('darwin-arm64', '1.2.3').entryPoints.setup.split(
        '/',
      ),
    );
    await writeFile(setupPath, '#!/usr/bin/env node\nprocess.exit(0);\n');
    await chmod(setupPath, 0o755);

    await expect(
      smokeExtractedAgentBundle({
        bundleRoot: relative(process.cwd(), bundleRoot),
        nativeSetupSmoke: true,
        timeoutMs: 10_000,
        userDataDir: relative(process.cwd(), join(root, 'user-data-fresh')),
      }),
    ).resolves.toMatchObject({ setupRequiredVerified: true });
  }, 15_000);

  test('rejects embedded deployment catalogs with packaging diagnostics', async () => {
    root = await mkdtemp('/tmp/ct-smoke-');
    const bundleRoot = join(root, 'bundle');
    await materializeBundle(bundleRoot, FAKE_AGENT);
    await writeFile(
      join(bundleRoot, 'agent', 'environments.json'),
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
    await expect(
      smokeExtractedAgentBundle({
        bundleRoot: relative(process.cwd(), bundleRoot),
        timeoutMs: 5_000,
        userDataDir: relative(process.cwd(), join(root, 'user-data')),
      }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(AgentBundleSmokeError);
      expect((error as AgentBundleSmokeError).kind).toBe(
        'NATIVE_SETUP_PACKAGING',
      );
      expect((error as Error).message).toMatch(/deployment URL catalog/i);
      return true;
    });
  });
});

async function materializeBundle(bundleRoot: string, agentSource: string) {
  const layout = createBundleLayout('darwin-arm64', '1.2.3');
  const files = new Map<string, string | Buffer>([
    ['layout.json', canonicalJson(layout)],
    [layout.entryPoints.agent, agentSource],
    ['agent/node_modules/playwright/package.json', '{}\n'],
    ['agent/node_modules/playwright-core/package.json', '{}\n'],
    ['licenses/NODE_LICENSE', 'Node license\n'],
    ['licenses/THIRD_PARTY_NOTICES.txt', 'Notices\n'],
    ['licenses/LICENSE-SLINT.md', 'Slint license\n'],
    ['bin/CthuTool Agent.app/Contents/Info.plist', '<plist/>\n'],
    [layout.entryPoints.tray, 'tray\n'],
    [layout.entryPoints.setup, 'setup\n'],
  ]);
  for (const [path, bytes] of files) {
    const destination = join(bundleRoot, ...path.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
  const bundledNode = join(bundleRoot, ...layout.entryPoints.node.split('/'));
  await mkdir(dirname(bundledNode), { recursive: true });
  await copyFile(process.execPath, bundledNode);
  await chmod(bundledNode, 0o755);
}

const FAKE_AGENT = String.raw`
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const args = process.argv.slice(2);
const dataRoot = args[args.indexOf('--user-data-dir') + 1];
const configPath = path.join(dataRoot, 'config.json');
let deploymentOrigin;
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  deploymentOrigin = config.deploymentOrigin;
} catch {
  process.stderr.write('Agent setup required: run Agent Settings or \`chc agent settings\` to configure the deployment Origin\n');
  process.exit(1);
}

const runtimeDir = path.join(dataRoot, 'runtime');
const instancePath = path.join(runtimeDir, 'instance.json');
const endpoint = path.join(runtimeDir, 'control.sock');
const switchDelayMs = Number(process.env.CTHUTOOL_SMOKE_SWITCH_DELAY_MS || 0);
const controlDelayMs = Number(process.env.CTHUTOOL_SMOKE_CONTROL_DELAY_MS || 0);
const healthDelayMs = Number(process.env.CTHUTOOL_SMOKE_HEALTH_DELAY_MS || 0);
let healthRequestCount = 0;
const nonce = crypto.randomUUID();
const instanceId = crypto.randomUUID();
const environmentId = 'self-use';

fs.mkdirSync(runtimeDir, { recursive: true, mode: 0o700 });
try { fs.rmSync(endpoint, { force: true }); } catch {}

const bridge = http.createServer((request, response) => {
  if (request.url !== '/v1/bootstrap' || request.headers.origin !== deploymentOrigin) {
    response.writeHead(403).end();
    return;
  }
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify({ environmentId, instanceId, protocolVersion: 1, supportedVersions: [1] }));
});

bridge.listen(0, '127.0.0.1', () => {
  const address = bridge.address();
  const bridgeEndpoint = 'http://127.0.0.1:' + address.port;
  const control = net.createServer((socket) => {
    let input = '';
    socket.setEncoding('utf8');
    socket.on('data', (chunk) => {
      input += chunk;
      if (!input.includes('\n')) return;
      const request = JSON.parse(input.slice(0, input.indexOf('\n')));
      let result;
      if (request.instanceNonce !== nonce) {
        socket.end(JSON.stringify({ ok: false, protocolVersion: 1, error: { code: 'UNAUTHORIZED_INSTANCE' } }) + '\n');
        return;
      }
      if (request.operation === 'health') {
        result = { applicationVersion: process.env.CTHUTOOL_AGENT_VERSION, bridge: { endpoint: bridgeEndpoint } };
        if (healthDelayMs > 0 && healthRequestCount++ === 0) {
          setTimeout(() => {
            socket.end(JSON.stringify({ ok: true, protocolVersion: 1, result }) + '\\n');
          }, healthDelayMs);
          return;
        }
      } else if (request.operation === 'environment.list') {
        result = { environments: [{ active: true, id: environmentId, label: 'Self-use' }] };
      } else if (request.operation === 'environment.switch') {
        result = { accepted: true, environmentId: request.environmentId };
        if (switchDelayMs > 0) {
          setTimeout(() => {
            socket.end(JSON.stringify({ ok: true, protocolVersion: 1, result }) + '\n');
          }, switchDelayMs);
          return;
        }
      } else if (request.operation === 'bridge.launch') {
        result = { endpoint: bridgeEndpoint, environmentId, instanceId, launchUrl: deploymentOrigin + '/agent#endpoint=' + encodeURIComponent(bridgeEndpoint) };
      } else if (request.operation === 'shutdown') {
        result = { accepted: true };
        socket.end(JSON.stringify({ ok: true, protocolVersion: 1, result }) + '\n', () => {
          control.close(() => bridge.close(() => {
            fs.rmSync(instancePath, { force: true });
            process.exit(0);
          }));
        });
        return;
      }
      socket.end(JSON.stringify({ ok: true, protocolVersion: 1, result }) + '\n');
    });
  });
  const writeInstanceRecord = () => {
    fs.writeFileSync(instancePath, JSON.stringify({
      controlEndpoint: endpoint,
      entryPoint: path.resolve(process.argv[1]),
      executablePath: path.resolve(process.execPath),
      nonce,
      pid: process.pid,
      protocolVersion: 1,
      startedAt: new Date().toISOString()
    }));
  };
  if (controlDelayMs > 0) {
    writeInstanceRecord();
    setTimeout(() => control.listen(endpoint), controlDelayMs);
  } else {
    control.listen(endpoint, writeInstanceRecord);
  }
});
`;
