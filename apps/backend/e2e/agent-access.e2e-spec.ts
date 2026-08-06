import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/main';

describe('private-network Agent access boundary (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CTHUTOOL_ENVIRONMENT_ID', 'prod');
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

  it('accepts loopback operator requests without gateway headers', async () => {
    await request(baseUrl)
      .get('/api/agents')
      .expect(200)
      .expect({ agents: [] });
  });

  it('registers Agents from private peers with environment id only', async () => {
    const ws = await connectAgent(baseUrl);
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

    const reconnect = await connectAgent(baseUrl);
    reconnect.send(agentHello());
    await expect(waitForMessage(reconnect)).resolves.toMatchObject({
      payload: { connectionGeneration: 2 },
    });
    reconnect.close();
  });

  it('rejects Agents that present another environment id', async () => {
    await expect(
      connectAgent(baseUrl, { environmentId: 'test' }),
    ).rejects.toBeDefined();

    await request(baseUrl)
      .get('/api/agents')
      .expect(200)
      .expect({ agents: [] });
  });

  it('does not require Authorization headers for Agent connections', async () => {
    const ws = await connectAgent(baseUrl, {
      authorization: `Agent ${'x'.repeat(32)}`,
    });
    ws.send(agentHello());
    await expect(waitForMessage(ws)).resolves.toMatchObject({
      type: 'agent.registered',
      payload: { environmentId: 'prod', agentId: 'agent-1' },
    });
    ws.close();
  });
});

async function connectAgent(
  baseUrl: string,
  options: {
    readonly environmentId?: string;
    readonly authorization?: string;
  } = {},
): Promise<WebSocket> {
  const headers: Record<string, string> = {
    'x-cthutool-environment-id': options.environmentId ?? 'prod',
  };
  if (options.authorization) {
    headers.authorization = options.authorization;
  }
  const ws = new WebSocket(`${baseUrl.replace('http', 'ws')}/ws/agents`, {
    headers,
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
