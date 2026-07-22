import { describe, expect, test } from 'vitest';
import { createAgentContentSecurityPolicy } from './agent-route-security';

describe('Agent route security policy', () => {
  test('allows only same-origin code and explicit loopback Fetch targets', () => {
    const csp = createAgentContentSecurityPolicy({ nonce: 'test-nonce' });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain(
      "script-src 'self' 'nonce-test-nonce' 'strict-dynamic'",
    );
    expect(csp).toContain('http://127.0.0.1:*');
    expect(csp).toContain('http://[::1]:*');
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/https?:\/\/(?!127\.0\.0\.1|\[::1\])/);
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test('uses only the development relaxations required by Next diagnostics', () => {
    const csp = createAgentContentSecurityPolicy({
      development: true,
      nonce: 'development-nonce',
    });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain(
      "style-src 'self' 'nonce-development-nonce' 'unsafe-inline'",
    );
  });
});
