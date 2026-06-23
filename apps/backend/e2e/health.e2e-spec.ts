import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GET /health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns contract-shaped health payload', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('backend');
    expect(typeof res.body.timestamp).toBe('string');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('returns readiness payload with dependency checks', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.browserAgent).toMatchObject({
      agentId: 'unknown',
      status: 'degraded',
    });
    expect(res.body.checks.diagnosticsStore).toMatchObject({
      enabled: true,
      status: 'ok',
    });
  });
});
