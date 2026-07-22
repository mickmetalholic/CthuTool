import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/main';

describe('public Agent access boundary (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const agentSecret = 's'.repeat(32);

  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CTHUTOOL_ENVIRONMENT_ID', 'prod');
    vi.stubEnv('CTHUTOOL_AGENT_SECRET', agentSecret);
    vi.stubEnv('CTHUTOOL_OPERATOR_ACCESS_MODE', 'trusted-proxy');
    vi.stubEnv('CTHUTOOL_TRUSTED_PROXY_IPS', '127.0.0.1');
    vi.stubEnv('CTHUTOOL_PRIVATE_DEVELOPMENT', '0');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('test server did not expose a TCP address');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('rejects anonymous status and accepts only trusted proxy identity', async () => {
    await request(baseUrl).get('/api/agents').expect(401);
    await request(baseUrl)
      .get('/api/agents')
      .set('x-cthutool-operator', 'owner@example.com')
      .expect(200);
  });

  it('rejects an invalid Agent secret before registration', async () => {
    await expect(connectAgent(baseUrl, 'x'.repeat(32))).rejects.toBeDefined();

    await request(baseUrl)
      .get('/api/agents')
      .set('x-cthutool-operator', 'owner@example.com')
      .expect(200)
      .expect({ agents: [] });
  });

  it('registers with the separate valid environment Agent secret', async () => {
    const ws = await connectAgent(baseUrl, agentSecret);
    ws.send(agentHello());
    const message = await waitForMessage(ws);
    expect(message).toMatchObject({
      type: 'agent.registered',
      payload: {
        environmentId: 'prod',
        agentId: 'agent-1',
        connectionGeneration: 1,
        protocolVersion: 1,
      },
    });
    ws.close();
    await onceClose(ws);

    const reconnect = await connectAgent(baseUrl, agentSecret);
    reconnect.send(agentHello());
    await expect(waitForMessage(reconnect)).resolves.toMatchObject({
      payload: { connectionGeneration: 2 },
    });
    reconnect.close();
  });
});

async function connectAgent(
  baseUrl: string,
  secret: string,
): Promise<WebSocket> {
  const ws = new WebSocket(`${baseUrl.replace('http', 'ws')}/ws/agents`, {
    headers: {
      authorization: `Agent ${secret}`,
      'x-cthutool-environment-id': 'prod',
    },
  });
  await new Promise<void>((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  return ws;
}

function agentHello(): string {
  return JSON.stringify({
    type: 'agent.hello',
    payload: {
      environmentId: 'prod',
      agentId: 'agent-1',
      protocolVersion: 1,
      capabilities: ['browser'],
      deviceName: 'Personal Agent',
      platform: 'darwin',
      version: '0.1.0',
    },
  });
}

function onceClose(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => ws.once('close', resolve));
}

function waitForMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    ws.once('message', (data) => resolve(JSON.parse(data.toString())));
    ws.once('error', reject);
  });
}
