import {
  BackendMetricsService,
  normalizeCommandType,
  normalizeHttpRoute,
  normalizeTaskLabel,
} from './metrics.service';

describe('BackendMetricsService', () => {
  it('renders Prometheus text exposition with backend metric families', async () => {
    const service = new BackendMetricsService();

    service.recordHttpRequest({
      durationMs: 25,
      method: 'GET',
      path: '/health/ready?token=secret',
      status: 200,
    });
    service.recordReadiness({
      browserAgentStatus: 'degraded',
      diagnosticsStoreStatus: 'ok',
      status: 'degraded',
    });
    service.recordBrowserTaskQueued({
      active: 0,
      label: 'browser:https://example.test/subject/123',
      queueLength: 1,
    });
    service.recordBrowserTaskCompleted({
      durationMs: 50,
      label: 'browser:https://example.test/subject/123',
    });
    service.recordAgentCommandCompleted({
      commandType: 'browser.capturePage',
      durationMs: 75,
      responseType: 'browser.result',
    });

    const output = await service.metrics();

    expect(output).toContain('# HELP cthutool_backend_http_requests_total');
    expect(output).toMatch(
      metricLine('cthutool_backend_http_requests_total', {
        method: 'GET',
        outcome: 'success',
        route: 'health_ready',
        status_class: '2xx',
      }),
    );
    expect(output).toMatch(
      metricLine('cthutool_backend_readiness_dependency_status', {
        dependency: 'browser_agent',
        status: 'degraded',
      }),
    );
    expect(output).toMatch(
      metricLine('cthutool_backend_browser_task_total', {
        outcome: 'queued',
        task: 'browser.capture',
      }),
    );
    expect(output).toMatch(
      metricLine('cthutool_backend_agent_command_total', {
        command_type: 'browser.capturePage',
        outcome: 'success',
      }),
    );
    expect(output).not.toContain('token=secret');
    expect(output).not.toContain('subject/123');
  });

  it('normalizes high-cardinality labels to bounded values', () => {
    expect(normalizeHttpRoute('/douban-movie-info/123?token=secret')).toBe(
      'douban_movie_info',
    );
    expect(normalizeHttpRoute('/unknown/123?token=secret')).toBe('other');
    expect(normalizeTaskLabel('browser:https://example.test/path')).toBe(
      'browser.capture',
    );
    expect(normalizeCommandType('browser.capturePage')).toBe(
      'browser.capturePage',
    );
    expect(normalizeCommandType('https://example.test/path')).toBe('unknown');
  });

  it('rejects unsafe label keys and values in helper assertions', () => {
    const service = new BackendMetricsService();

    expect(() =>
      service.assertSafeLabelsForTest({ requestId: 'req-1' }),
    ).toThrow(/unsafe metric label key/);
    expect(() =>
      service.assertSafeLabelsForTest({ route: '/raw/path?x=1' }),
    ).toThrow(/unsafe metric label value/);
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
