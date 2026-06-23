import type { Request } from 'express';
import { redactDetails } from './redaction';
import {
  createRequestContext,
  currentObservabilityMetadata,
  REQUEST_ID_HEADER,
  runWithRequestContext,
} from './request-context';

describe('backend request context', () => {
  it('preserves a valid request id header', () => {
    const request = createRequest({
      [REQUEST_ID_HEADER]: 'req-123',
      'x-trace-id': 'trace-123',
    });

    const context = createRequestContext(request);

    expect(context.requestId).toBe('req-123');
    expect(context.traceId).toBe('trace-123');
    expect(context.method).toBe('GET');
    expect(context.path).toBe('/health');
  });

  it('generates a request id when the header is missing or invalid', () => {
    const request = createRequest({ [REQUEST_ID_HEADER]: '../bad' });

    const context = createRequestContext(request);

    expect(context.requestId).toEqual(expect.any(String));
    expect(context.requestId).not.toBe('../bad');
  });

  it('builds agent observability metadata from current context', () => {
    const request = createRequest({ [REQUEST_ID_HEADER]: 'req-123' });
    const context = createRequestContext(request);

    const metadata = runWithRequestContext(context, () =>
      currentObservabilityMetadata({
        commandId: 'cmd-1',
        operation: 'browser.capturePage',
      }),
    );

    expect(metadata).toEqual({
      commandId: 'cmd-1',
      operation: 'browser.capturePage',
      requestId: 'req-123',
    });
  });
});

describe('observability redaction', () => {
  it('redacts sensitive fields and bounds large strings', () => {
    const result = redactDetails({
      html: '<html>secret</html>',
      nested: { token: 'secret-token' },
      safe: 'x'.repeat(600),
      screenshotBase64: 'base64',
    });

    expect(result).toMatchObject({
      html: '[redacted]',
      nested: { token: '[redacted]' },
      screenshotBase64: '[redacted]',
    });
    expect((result as { safe: string }).safe).toContain('[truncated]');
  });
});

function createRequest(headers: Record<string, string>): Request {
  return {
    header: (name: string) => headers[name.toLowerCase()],
    method: 'GET',
    originalUrl: '/health',
    url: '/health',
  } as Request;
}
