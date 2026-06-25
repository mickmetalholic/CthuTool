import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BrowserPublicApiController } from '../src/modules/browser/public-api/browser-public-api.controller';
import { BrowserPublicApiService } from '../src/modules/browser/public-api/browser-public-api.service';

describe('Browser public API (e2e)', () => {
  let app: INestApplication;
  const service = {
    closeSession: vi.fn(async (sessionId: string) => ({
      closed: true,
      sessionId,
    })),
    createSession: vi.fn(async () => ({
      session: {
        agentId: 'agent-1',
        authPolicy: 'anonymous',
        createdAt: '2026-06-13T10:00:00.000Z',
        expiresAt: '2026-06-13T10:15:00.000Z',
        lastUsedAt: '2026-06-13T10:00:00.000Z',
        sessionId: 'session-1',
        siteId: 'example',
        status: 'active',
      },
    })),
    runActions: vi.fn(async (sessionId: string) => ({
      actionResults: [
        { actionId: 'a1', html: '<html>ok</html>', type: 'content' },
      ],
      capturedAt: '2026-06-13T10:00:01.000Z',
      sessionId,
    })),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BrowserPublicApiController],
      providers: [{ provide: BrowserPublicApiService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('routes session creation requests', async () => {
    await request(app.getHttpServer())
      .post('/api/browser/sessions')
      .send({ siteId: 'example' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.session.sessionId).toBe('session-1');
      });
    expect(service.createSession).toHaveBeenCalledWith({ siteId: 'example' });
  });

  it('routes session action requests', async () => {
    await request(app.getHttpServer())
      .post('/api/browser/sessions/session-1/actions')
      .send({ actions: [{ actionId: 'a1', type: 'content' }] })
      .expect(201)
      .expect(({ body }) => {
        expect(body.actionResults).toEqual([
          { actionId: 'a1', html: '<html>ok</html>', type: 'content' },
        ]);
      });
    expect(service.runActions).toHaveBeenCalledWith('session-1', {
      actions: [{ actionId: 'a1', type: 'content' }],
    });
  });

  it('routes session close requests', async () => {
    await request(app.getHttpServer())
      .delete('/api/browser/sessions/session-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ closed: true, sessionId: 'session-1' });
      });
    expect(service.closeSession).toHaveBeenCalledWith('session-1');
  });
});
