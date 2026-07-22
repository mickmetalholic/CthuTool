const { existsSync } = require('node:fs');
const { createServer } = require('node:http');
const { chromium } = require('playwright');
const { AgentLocalBridge } = require('../dist/index.js');

const targets = [
  {
    executablePath:
      process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : undefined,
    name: 'Google Chrome',
  },
  {
    executablePath:
      process.platform === 'darwin'
        ? '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
        : undefined,
    name: 'Microsoft Edge',
  },
];

void run().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exitCode = 1;
});

async function run() {
  const results = [];
  for (const target of targets) {
    if (!target.executablePath || !existsSync(target.executablePath)) {
      results.push({ name: target.name, status: 'not-installed' });
      continue;
    }
    results.push(await runChromiumProbe(target));
  }
  results.push({
    name: 'Firefox',
    status:
      process.platform === 'darwin' && existsSync('/Applications/Firefox.app')
        ? 'manual-required'
        : 'not-installed',
  });
  results.push({
    name: 'Safari',
    status:
      process.platform === 'darwin' && existsSync('/Applications/Safari.app')
        ? 'manual-required'
        : 'not-installed',
  });
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);

  const executed = results.filter((result) => result.status === 'passed');
  const failed = results.filter((result) => result.status === 'failed');
  if (executed.length === 0 || failed.length > 0) {
    process.exitCode = 1;
  }
}

async function runChromiumProbe(target) {
  let browser;
  let bridge;
  let sourceServer;
  try {
    sourceServer = createSourceServer();
    const source = await listen(sourceServer);
    bridge = new AgentLocalBridge({
      deleteProfile: async () => undefined,
      executeBrowserCommand: async () => ({ ok: true }),
      getContext: () => ({
        environmentId: 'lna-spike',
        webAgentUrl: `${source.origin}/agent`,
        webOrigin: source.origin,
      }),
      getResources: () => resourceSnapshot(source.origin),
      lifecycleAction: async () => ({ accepted: true }),
      updateSettings: async () => ({ effect: 'immediate' }),
    });
    await bridge.start();
    const launch = bridge.issueLaunch();
    browser = await chromium.launch({
      args: [`--ip-address-space-overrides=127.0.0.1:${source.port}=public`],
      executablePath: target.executablePath,
      headless: true,
    });
    const context = await browser.newContext();
    await context.grantPermissions(['local-network-access'], {
      origin: source.origin,
    });
    const page = await context.newPage();
    await page.goto(launch.launchUrl);
    await page.waitForFunction(
      () => globalThis.__cthutoolLnaProbe?.done,
      null,
      {
        timeout: 15_000,
      },
    );
    const result = await page.evaluate(() => globalThis.__cthutoolLnaProbe);
    if (!result?.ok || !result.fragmentCleared) {
      throw new Error(result?.error ?? 'Browser loopback Fetch probe failed');
    }
    return {
      browserVersion: browser.version(),
      fragmentCleared: result.fragmentCleared,
      name: target.name,
      status: 'passed',
      targetAddressSpace: result.targetAddressSpace,
      transport: 'fetch-polling-compatible',
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      name: target.name,
      status: 'failed',
    };
  } finally {
    await browser?.close().catch(() => undefined);
    await bridge?.stop().catch(() => undefined);
    await close(sourceServer).catch(() => undefined);
  }
}

function createSourceServer() {
  return createServer((_request, response) => {
    response.statusCode = 200;
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader(
      'Permissions-Policy',
      'local-network-access=(self), local-network=(self), loopback-network=(self)',
    );
    response.end(`<!doctype html>
<html><body><script>
void (async () => {
  const params = new URLSearchParams(location.hash.slice(1));
  const endpoint = params.get('endpoint');
  const environmentId = params.get('environment');
  const instanceId = params.get('instance');
  const ticket = params.get('ticket');
  history.replaceState(null, '', location.pathname);
  try {
    const request = new Request(endpoint + '/v1/session', {
      body: JSON.stringify({ environmentId, instanceId, supportedVersions: [1], ticket }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      targetAddressSpace: 'loopback',
    });
    const targetAddressSpace = request.targetAddressSpace || 'unsupported';
    const exchange = await fetch(request);
    const session = await exchange.json();
    const resources = await fetch(endpoint + '/v1/resources', {
      credentials: 'omit',
      headers: { authorization: 'Bearer ' + session.sessionToken },
      mode: 'cors',
      targetAddressSpace: 'loopback',
    });
    const snapshot = await resources.json();
    globalThis.__cthutoolLnaProbe = {
      done: true,
      fragmentCleared: location.hash === '',
      ok: exchange.ok && resources.ok && snapshot.environment?.id === 'lna-spike',
      targetAddressSpace,
    };
  } catch (error) {
    globalThis.__cthutoolLnaProbe = {
      done: true,
      error: error instanceof Error ? error.message : String(error),
      fragmentCleared: location.hash === '',
      ok: false,
    };
  }
})();
</script></body></html>`);
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      const address = server.address();
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        port: address.port,
      });
    });
  });
}

function close(server) {
  if (!server?.listening) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function resourceSnapshot(webOrigin) {
  return {
    agent: {
      backendStatus: 'connected',
      deviceName: 'LNA probe',
      id: 'agent-lna-probe',
      processState: 'ready',
      version: '0.0.0-spike',
    },
    autostart: { enabled: false, supported: false },
    browser: {
      executablePathConfigured: false,
      message: 'probe',
      ready: true,
      status: 'ready',
    },
    diagnostics: [],
    environment: {
      backendHttpUrl: 'https://api.example.com',
      id: 'lna-spike',
      label: 'LNA spike',
      webOrigin,
    },
    profiles: [],
    protocolVersion: 1,
    secret: { status: 'missing' },
  };
}
