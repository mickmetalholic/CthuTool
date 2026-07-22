import { Buffer } from 'node:buffer';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAgentContentSecurityPolicy } from '@/lib/agent-route-security';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const contentSecurityPolicy = createAgentContentSecurityPolicy({
    development: process.env.NODE_ENV === 'development',
    nonce,
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: ['/agent/:path*'],
};
