import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GET /metrics (e2e)', () => {
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

  it('returns Prometheus scrape-compatible backend metrics', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer()).get('/health/ready').expect(200);

    const res = await request(app.getHttpServer()).get('/metrics').expect(200);

    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('# HELP cthutool_backend_http_requests_total');
    expect(res.text).toMatch(
      metricLine('cthutool_backend_http_requests_total', {
        method: 'GET',
        outcome: 'success',
        route: 'health',
        status_class: '2xx',
      }),
    );
    expect(res.text).toContain('cthutool_backend_readiness_dependency_status');
    expect(res.text).toContain('cthutool_backend_browser_task_queue_length');
    expect(res.text).toContain('cthutool_backend_agent_command_total');
    expect(res.text).not.toContain('x-request-id');
    expect(res.text).not.toContain('x-trace-id');
  });
});

function metricLine(
  name: string,
  labels: Record<string, string>,
  value = '1',
): RegExp {
  const lookaheads = Object.entries(labels)
    .map(([key, item]) => `(?=[^}]*${key}="${escapeRegExp(item)}")`)
    .join('');
  return new RegExp(`${name}\\{${lookaheads}[^}]*\\} ${value}`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
