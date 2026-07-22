import type { NextConfig } from 'next';

export const agentRouteHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-store',
  },
  {
    key: 'Referrer-Policy',
    value: 'no-referrer',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
] as const;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [...agentRouteHeaders],
        source: '/agent/:path*',
      },
    ];
  },
  reactCompiler: true,
};

export default nextConfig;
