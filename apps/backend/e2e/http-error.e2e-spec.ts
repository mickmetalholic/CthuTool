import type { INestApplication } from '@nestjs/common';
import { Controller, Get, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/filters/http-exception.filter';

@Controller('boom')
class BoomController {
  @Get('/')
  throwError(): never {
    throw new Error('unexpected failure');
  }
}

@Module({
  controllers: [BoomController],
})
class BoomModule {}

describe('Unhandled error (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BoomModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ErrorResponse for unknown runtime error', async () => {
    const res = await request(app.getHttpServer()).get('/boom').expect(500);
    expect(res.body).toMatchObject({
      code: 'HTTP_ERROR',
      message: 'Request failed',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });
});
