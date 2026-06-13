import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import WebSocket from 'ws';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/main';

describe('Agent registry (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0);
    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('test server did not expose a TCP address');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registers an agent over WebSocket and lists it over HTTP', async () => {
    const ws = await connectAgent(baseUrl);
    const registered = await waitForMessage(ws);

    expect(registered).toEqual({
      type: 'agent.registered',
      payload: {
        agentId: 'homelab-mac',
        serverTime: expect.any(String),
      },
    });

    await request(baseUrl)
      .get('/api/agents')
      .expect(200)
      .expect(({ body }) => {
        expect(body.agents).toEqual([
          expect.objectContaining({
            agentId: 'homelab-mac',
            deviceName: 'Homelab Mac',
            platform: 'darwin',
            capabilities: [],
            state: 'online',
          }),
        ]);
        expect(JSON.stringify(body)).not.toContain('_socket');
      });

    ws.close();
  });

  it('allows the desktop renderer origin to fetch connected agents', async () => {
    await request(baseUrl)
      .get('/api/agents')
      .set('Origin', 'http://localhost:5173')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'http://localhost:5173');
  });

  it('rejects invalid registration without listing the agent', async () => {
    const ws = new WebSocket(`${baseUrl.replace('http', 'ws')}/ws/agents`);
    await onceOpen(ws);
    ws.send(
      JSON.stringify({ type: 'agent.hello', payload: { agentId: '../bad' } }),
    );

    const message = await waitForMessage(ws);
    expect(message).toEqual({
      type: 'agent.error',
      payload: expect.objectContaining({
        code: 'invalid_agent_message',
      }),
    });

    await onceClose(ws);

    await request(baseUrl)
      .get('/api/agents')
      .expect(200)
      .expect(({ body }) => {
        expect(body.agents).toEqual([]);
      });
  });

  it('removes an agent when the WebSocket disconnects', async () => {
    const ws = await connectAgent(baseUrl);
    await waitForMessage(ws);
    ws.close();
    await onceClose(ws);

    await request(baseUrl)
      .get('/api/agents')
      .expect(200)
      .expect(({ body }) => {
        expect(body.agents).toEqual([]);
      });
  });
});

async function connectAgent(baseUrl: string): Promise<WebSocket> {
  const ws = new WebSocket(`${baseUrl.replace('http', 'ws')}/ws/agents`);
  await onceOpen(ws);
  ws.send(
    JSON.stringify({
      type: 'agent.hello',
      payload: {
        agentId: 'homelab-mac',
        deviceName: 'Homelab Mac',
        platform: 'darwin',
        version: '0.1.0',
        capabilities: [],
      },
    }),
  );
  return ws;
}

function onceOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
}

function onceClose(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    ws.once('close', () => resolve());
  });
}

function waitForMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    ws.once('message', (data) => {
      resolve(JSON.parse(data.toString()));
    });
    ws.once('error', reject);
  });
}
