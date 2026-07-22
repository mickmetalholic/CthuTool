export function createAgentContentSecurityPolicy(input: {
  readonly nonce: string;
  readonly development?: boolean;
}): string {
  const developmentScript = input.development ? " 'unsafe-eval'" : '';
  const developmentStyle = input.development ? " 'unsafe-inline'" : '';
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'self' http://127.0.0.1:* http://[::1]:*",
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    `script-src 'self' 'nonce-${input.nonce}' 'strict-dynamic'${developmentScript}`,
    "script-src-attr 'none'",
    `style-src 'self' 'nonce-${input.nonce}'${developmentStyle}`,
    "style-src-attr 'none'",
    "worker-src 'none'",
  ].join('; ');
}
