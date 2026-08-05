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
import { smokeExtractedAgentBundle } from './smoke';

describe('clean-host Agent bundle smoke', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) {
      await rm(root, { force: true, recursive: true });
      root = undefined;
    }
  });

  test('uses the bundled Node with an empty PATH and coordinates shutdown', async () => {
    root = await mkdtemp('/tmp/ct-smoke-');
    const bundleRoot = join(root, 'bundle');
    const layout = createBundleLayout('darwin-arm64', '1.2.3');
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
    const files = new Map<string, string | Buffer>([
      ['layout.json', canonicalJson(layout)],
      [layout.entryPoints.agent, FAKE_AGENT],
      [layout.entryPoints.environmentCatalog, canonicalJson(catalog)],
      ['agent/node_modules/playwright/package.json', '{}\n'],
      ['agent/node_modules/playwright-core/package.json', '{}\n'],
      ['licenses/NODE_LICENSE', 'Node license\n'],
      ['licenses/THIRD_PARTY_NOTICES.txt', 'Notices\n'],
      ['bin/CthuTool Agent.app/Contents/Info.plist', '<plist/>\n'],
      [layout.entryPoints.tray, 'tray\n'],
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
    const result = await smokeExtractedAgentBundle({
      bundleRoot: relative(process.cwd(), bundleRoot),
      timeoutMs: 10_000,
      userDataDir: relative(process.cwd(), join(root, 'user-data')),
    });
    expect(result).toMatchObject({
      applicationVersion: '1.2.3',
      bundledNodePath: await realpath(bundledNode),
      environmentId: 'production',
    });
  });
});

const FAKE_AGENT = String.raw`
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const args = process.argv.slice(2);
const dataRoot = args[args.indexOf('--user-data-dir') + 1];
const runtimeDir = path.join(dataRoot, 'runtime');
const instancePath = path.join(runtimeDir, 'instance.json');
const endpoint = path.join(runtimeDir, 'control.sock');
const catalog = JSON.parse(fs.readFileSync(process.env.CTHUTOOL_AGENT_ENVIRONMENTS_PATH, 'utf8'));
const environment = catalog.profiles[0];
const nonce = crypto.randomUUID();
const instanceId = crypto.randomUUID();

fs.mkdirSync(runtimeDir, { recursive: true, mode: 0o700 });
try { fs.rmSync(endpoint, { force: true }); } catch {}

const bridge = http.createServer((request, response) => {
  if (request.url !== '/v1/bootstrap' || request.headers.origin !== environment.webOrigin) {
    response.writeHead(403).end();
    return;
  }
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify({ environmentId: environment.environmentId, instanceId, protocolVersion: 1, supportedVersions: [1] }));
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
      } else if (request.operation === 'environment.list') {
        result = { environments: [{ active: true, id: environment.environmentId, label: environment.label }] };
      } else if (request.operation === 'environment.switch') {
        result = { accepted: true, environmentId: request.environmentId };
      } else if (request.operation === 'bridge.launch') {
        result = { endpoint: bridgeEndpoint, environmentId: environment.environmentId, instanceId, launchUrl: environment.webAgentUrl + '#endpoint=' + encodeURIComponent(bridgeEndpoint) };
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
  control.listen(endpoint, () => {
    fs.writeFileSync(instancePath, JSON.stringify({
      controlEndpoint: endpoint,
      entryPoint: path.resolve(process.argv[1]),
      executablePath: path.resolve(process.execPath),
      nonce,
      pid: process.pid,
      protocolVersion: 1,
      startedAt: new Date().toISOString()
    }));
  });
});
`;
