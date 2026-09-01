import { request as httpRequest } from 'node:http';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AgentLocalBridge } from './local-bridge';

const origin = 'https://app.example.com';
let tokenCounter = 0;
let now = new Date('2026-07-22T00:00:00.000Z');
let activeBridge: AgentLocalBridge | undefined;

afterEach(async () => {
  await activeBridge?.stop();
  activeBridge = undefined;
  tokenCounter = 0;
  now = new Date('2026-07-22T00:00:00.000Z');
});

describe('AgentLocalBridge', () => {
  test('binds a random loopback port and serves JSON only', async () => {
    const bridge = await createBridge();
    const info = bridge.getInfo();
    expect(info).toMatchObject({
      host: '127.0.0.1',
      protocolVersion: 1,
    });
    expect(info?.port).toBeGreaterThan(0);

    const response = await fetch(`${info?.endpoint}/index.html`, {
      headers: { origin },
    });
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.text()).not.toContain('<html');
  });

  test('supports an explicitly verified IPv6 loopback binding', async () => {
    const bridge = await createBridge({ bindHost: '::1' });
    const info = bridge.getInfo();
    expect(info).toMatchObject({ host: '::1' });
    const response = await fetch(`${info?.endpoint}/v1/bootstrap`, {
      headers: { origin },
    });
    expect(response.status).toBe(200);
  });

  test('exchanges one-time ticket for an origin-scoped memory bearer', async () => {
    const bridge = await createBridge();
    const launch = bridge.issueLaunch();
    const fragment = new URLSearchParams(
      new URL(launch.launchUrl).hash.slice(1),
    );
    const response = await exchange(launch.endpoint, {
      environmentId: 'prod',
      instanceId: launch.instanceId,
      ticket: fragment.get('ticket') ?? '',
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
    expect(response.headers.get('vary')).toBe('Origin');
    expect(response.headers.get('set-cookie')).toBeNull();
    const session = await response.json();
    expect(session).toMatchObject({
      environmentId: 'prod',
      instanceId: launch.instanceId,
      protocolVersion: 1,
    });
    expect(session.sessionToken).toMatch(/^[a-zA-Z0-9_-]{32,}$/);

    const replay = await exchange(launch.endpoint, {
      environmentId: 'prod',
      instanceId: launch.instanceId,
      ticket: fragment.get('ticket') ?? '',
    });
    expect(await replay.json()).toMatchObject({
      error: { code: 'TICKET_INVALID' },
    });

    const resources = await fetch(`${launch.endpoint}/v1/resources`, {
      headers: {
        authorization: `Bearer ${session.sessionToken}`,
        origin,
      },
    });
    expect(resources.status).toBe(200);
    const payload = (await resources.json()) as Record<string, unknown>;
    expect(payload).toMatchObject({
      agent: { backendStatus: 'connected' },
    });
    expect(payload).not.toHaveProperty('secret');
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('"secret"');
    expect(serialized).not.toContain('agent-secret-value');
    expect(serialized).not.toContain(session.sessionToken);
  });

  test('rejects wrong Origin, Host, environment, expired tickets, and cookie-only calls', async () => {
    const bridge = await createBridge();
    const launch = bridge.issueLaunch();
    const ticket = new URLSearchParams(
      new URL(launch.launchUrl).hash.slice(1),
    ).get('ticket');

    const wrongOrigin = await fetch(`${launch.endpoint}/v1/bootstrap`, {
      headers: { origin: 'https://evil.example.com' },
    });
    expect(wrongOrigin.status).toBe(403);
    expect(wrongOrigin.headers.get('access-control-allow-origin')).toBeNull();

    const wrongHost = await rawJsonRequest(`${launch.endpoint}/v1/bootstrap`, {
      host: 'evil.example.com',
      origin,
    });
    expect(wrongHost).toMatchObject({
      error: { code: 'HOST_DENIED' },
    });

    const wrongEnvironment = await exchange(launch.endpoint, {
      environmentId: 'test',
      instanceId: launch.instanceId,
      ticket: ticket ?? '',
    });
    expect(await wrongEnvironment.json()).toMatchObject({
      error: { code: 'ENVIRONMENT_MISMATCH' },
    });

    const instanceLaunch = bridge.issueLaunch();
    const instanceTicket = new URLSearchParams(
      new URL(instanceLaunch.launchUrl).hash.slice(1),
    ).get('ticket');
    const wrongInstance = await exchange(instanceLaunch.endpoint, {
      environmentId: 'prod',
      instanceId: 'other-bridge-instance',
      ticket: instanceTicket ?? '',
    });
    expect(await wrongInstance.json()).toMatchObject({
      error: { code: 'INSTANCE_MISMATCH' },
    });

    const expiringLaunch = bridge.issueLaunch();
    const expiringTicket = new URLSearchParams(
      new URL(expiringLaunch.launchUrl).hash.slice(1),
    ).get('ticket');
    now = new Date(now.getTime() + 61_000);
    const expired = await exchange(expiringLaunch.endpoint, {
      environmentId: 'prod',
      instanceId: expiringLaunch.instanceId,
      ticket: expiringTicket ?? '',
    });
    expect(await expired.json()).toMatchObject({
      error: { code: 'TICKET_EXPIRED' },
    });

    const cookieOnly = await fetch(`${launch.endpoint}/v1/resources`, {
      headers: { cookie: 'bridge=guess', origin },
    });
    expect(await cookieOnly.json()).toMatchObject({
      error: { code: 'SESSION_INVALID' },
    });

    const blindPortProbe = await fetch(`${launch.endpoint}/v1/bootstrap`);
    expect(await blindPortProbe.json()).toMatchObject({
      error: { code: 'ORIGIN_DENIED' },
    });
    expect(
      blindPortProbe.headers.get('access-control-allow-origin'),
    ).toBeNull();
  });

  test('requires non-simple JSON and restricts preflight headers', async () => {
    const bridge = await createBridge();
    const endpoint = bridge.getInfo()?.endpoint ?? '';
    const form = await fetch(`${endpoint}/v1/session`, {
      body: 'ticket=guess',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin },
      method: 'POST',
    });
    expect(await form.json()).toMatchObject({
      error: { code: 'CONTENT_TYPE_REQUIRED' },
    });

    const allowed = await fetch(`${endpoint}/v1/rpc`, {
      headers: {
        'access-control-request-headers': 'authorization, content-type',
        'access-control-request-method': 'POST',
        origin,
      },
      method: 'OPTIONS',
    });
    expect(allowed.status).toBe(204);
    const denied = await fetch(`${endpoint}/v1/rpc`, {
      headers: {
        'access-control-request-headers': 'x-unsafe-header',
        'access-control-request-method': 'POST',
        origin,
      },
      method: 'OPTIONS',
    });
    expect(denied.status).toBe(403);
  });

  test('invalidates sessions and enforces typed local operations', async () => {
    const updateSettings = vi.fn(async () => ({
      effect: 'reconnect-required',
    }));
    const deleteProfile = vi.fn(async () => undefined);
    const executeBrowserCommand = vi.fn(async () => ({ ok: true }));
    const bridge = await createBridge({
      deleteProfile,
      executeBrowserCommand,
      isProfileLocked: ({ profileName }) => profileName === 'locked',
      lifecycleAction: async (action) => ({
        accepted: action === 'agent.quit',
      }),
      updateSettings,
    });
    const { endpoint, sessionToken } = await openSession(bridge);

    const settings = await rpc(endpoint, sessionToken, 'settings.update', {
      connectionEnabled: false,
    });
    expect(await settings.json()).toMatchObject({
      ok: true,
      result: { effect: 'reconnect-required' },
    });
    expect(updateSettings).toHaveBeenCalledWith({ connectionEnabled: false });

    const unconfirmed = await rpc(endpoint, sessionToken, 'profile.delete', {
      profileName: 'main',
      siteId: 'example',
    });
    expect(await unconfirmed.json()).toMatchObject({
      error: { code: 'CONFIRMATION_REQUIRED' },
    });
    const locked = await rpc(endpoint, sessionToken, 'profile.delete', {
      confirm: true,
      profileName: 'locked',
      siteId: 'example',
    });
    expect(await locked.json()).toMatchObject({
      error: { code: 'PROFILE_LOCKED' },
    });
    const deleted = await rpc(endpoint, sessionToken, 'profile.delete', {
      confirm: true,
      profileName: 'main',
      siteId: 'example',
    });
    expect(await deleted.json()).toMatchObject({
      ok: true,
      result: { deleted: true },
    });
    expect(deleteProfile).toHaveBeenCalledWith({
      profileName: 'main',
      siteId: 'example',
    });

    const arbitraryScript = await rpc(
      endpoint,
      sessionToken,
      'browser.command',
      {
        id: 'browser-1',
        jsonrpc: '2.0',
        method: 'browser.evaluate',
        params: { script: 'return document.cookie' },
      },
    );
    expect(await arbitraryScript.json()).toMatchObject({
      error: { code: 'BROWSER_COMMAND_REJECTED' },
    });
    expect(executeBrowserCommand).not.toHaveBeenCalled();

    const unavailableLifecycle = await rpc(
      endpoint,
      sessionToken,
      'lifecycle.action',
      { action: 'agent.restart' },
    );
    expect(await unavailableLifecycle.json()).toMatchObject({
      error: { code: 'LIFECYCLE_UNAVAILABLE' },
    });

    const acceptedQuit = await rpc(endpoint, sessionToken, 'lifecycle.action', {
      action: 'agent.quit',
    });
    expect(await acceptedQuit.json()).toMatchObject({
      ok: true,
      result: { accepted: true },
    });

    const excessiveTimeout = await rpc(
      endpoint,
      sessionToken,
      'browser.command',
      {
        id: 'browser-timeout',
        jsonrpc: '2.0',
        method: 'browser.capturePage',
        params: {
          authPolicy: 'anonymous',
          siteId: 'example',
          timeoutMs: 120_001,
          url: 'https://example.com',
        },
      },
    );
    expect(await excessiveTimeout.json()).toMatchObject({
      error: { code: 'BROWSER_COMMAND_REJECTED' },
    });
    expect(executeBrowserCommand).not.toHaveBeenCalled();

    const environmentMutation = await rpc(
      endpoint,
      sessionToken,
      'browser.command',
      {
        environmentId: 'test',
        id: 'browser-2',
        jsonrpc: '2.0',
        method: 'browser.capturePage',
        params: {
          authPolicy: 'anonymous',
          siteId: 'example',
          url: 'https://example.com',
        },
      },
    );
    expect(await environmentMutation.json()).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    });

    bridge.invalidate();
    const stale = await fetch(`${endpoint}/v1/resources`, {
      headers: { authorization: `Bearer ${sessionToken}`, origin },
    });
    expect(await stale.json()).toMatchObject({
      error: { code: 'SESSION_INVALID' },
    });
  });

  test('rejects Origin and Secret trust-boundary mutations from Web', async () => {
    const updateSettings = vi.fn(async () => ({
      effect: 'none',
    }));
    const bridge = await createBridge({ updateSettings });
    const { endpoint, sessionToken } = await openSession(bridge);

    const forbidden = [
      { webOrigin: 'https://evil.example.com' },
      { deploymentOrigin: 'https://evil.example.com' },
      { origin: 'https://evil.example.com' },
      { secret: 'x'.repeat(32) },
      { agentSecret: 'y'.repeat(32) },
      { environmentId: 'other' },
      { backendHttpUrl: 'https://evil.example.com' },
      { backendAgentWsUrl: 'wss://evil.example.com/ws/agents' },
      { connectionEnabled: true, secret: 'z'.repeat(32) },
      { nested: { deploymentOrigin: 'https://evil.example.com' } },
    ];

    for (const params of forbidden) {
      const response = await rpc(
        endpoint,
        sessionToken,
        'settings.update',
        params,
      );
      const body = await response.json();
      expect(body).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      });
      expect(body.error.message).toMatch(
        /native Agent Settings|chc agent settings/i,
      );
    }

    expect(updateSettings).not.toHaveBeenCalled();
  });

  test('expires bearer sessions independently from one-time tickets', async () => {
    const bridge = await createBridge({ sessionTtlMs: 5_000 });
    const { endpoint, sessionToken } = await openSession(bridge);
    now = new Date(now.getTime() + 5_001);

    const response = await fetch(`${endpoint}/v1/resources`, {
      headers: { authorization: `Bearer ${sessionToken}`, origin },
    });

    expect(await response.json()).toMatchObject({
      error: { code: 'SESSION_EXPIRED' },
    });
  });
});

async function createBridge(
  overrides: Partial<ConstructorParameters<typeof AgentLocalBridge>[0]> = {},
): Promise<AgentLocalBridge> {
  const bridge = new AgentLocalBridge({
    deleteProfile: async () => undefined,
    executeBrowserCommand: async () => ({ ok: true }),
    getContext: () => ({
      environmentId: 'prod',
      webAgentUrl: `${origin}/agent`,
      webOrigin: origin,
    }),
    getResources: () => ({
      agent: {
        backendStatus: 'connected',
        deviceName: 'Personal Agent',
        id: 'agent-1',
        processState: 'ready',
        version: '0.1.0',
      },
      autostart: { enabled: false, supported: false },
      browser: {
        executablePathConfigured: false,
        message: 'Chrome ready',
        ready: true,
        status: 'ready',
      },
      diagnostics: [],
      environment: {
        backendHttpUrl: 'https://api.example.com',
        id: 'prod',
        label: 'Production',
        webOrigin: origin,
      },
      profiles: [],
      protocolVersion: 1,
    }),
    instanceId: 'bridge-instance-1',
    lifecycleAction: async () => ({ accepted: true }),
    now: () => now,
    randomToken: () => `token-${++tokenCounter}-${'x'.repeat(32)}`,
    updateSettings: async () => ({ effect: 'immediate' }),
    ...overrides,
  });
  await bridge.start();
  activeBridge = bridge;
  return bridge;
}

async function openSession(bridge: AgentLocalBridge): Promise<{
  readonly endpoint: string;
  readonly sessionToken: string;
}> {
  const launch = bridge.issueLaunch();
  const ticket = new URLSearchParams(
    new URL(launch.launchUrl).hash.slice(1),
  ).get('ticket');
  const response = await exchange(launch.endpoint, {
    environmentId: launch.environmentId,
    instanceId: launch.instanceId,
    ticket: ticket ?? '',
  });
  const session = await response.json();
  return { endpoint: launch.endpoint, sessionToken: session.sessionToken };
}

function exchange(
  endpoint: string,
  input: {
    readonly environmentId: string;
    readonly instanceId: string;
    readonly ticket: string;
  },
): Promise<Response> {
  return fetch(`${endpoint}/v1/session`, {
    body: JSON.stringify({ ...input, supportedVersions: [1] }),
    headers: { 'content-type': 'application/json', origin },
    method: 'POST',
  });
}

function rpc(
  endpoint: string,
  sessionToken: string,
  method: string,
  params: unknown,
): Promise<Response> {
  return fetch(`${endpoint}/v1/rpc`, {
    body: JSON.stringify({ id: 'rpc-1', method, params, protocolVersion: 1 }),
    headers: {
      authorization: `Bearer ${sessionToken}`,
      'content-type': 'application/json',
      origin,
    },
    method: 'POST',
  });
}

function rawJsonRequest(
  target: string,
  headers: Record<string, string>,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(target, { headers }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => resolve(JSON.parse(raw)));
    });
    request.once('error', reject);
    request.end();
  });
}
