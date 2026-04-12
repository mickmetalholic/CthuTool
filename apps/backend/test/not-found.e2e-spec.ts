import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/filters/http-exception.filter';

describe('Undefined route (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ErrorResponse for unknown route', async () => {
    const res = await request(app.getHttpServer()).get('/missing').expect(404);
    expect(res.body).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Route not found',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });
});
