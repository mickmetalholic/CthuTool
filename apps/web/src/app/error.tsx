'use client';

import { useEffect } from 'react';
import { createWebLogger, recordUiError } from '@/lib/observability';

const logger = createWebLogger('web.route');

export default function RouteErrorBoundary({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    recordUiError(logger, error, {
      details: {
        digest: error.digest,
      },
      event: 'ui.error_boundary',
      message: 'Route rendering failed',
      route: '/',
    });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center p-8">
      <section className="max-w-xl text-center">
        <p className="text-sm font-medium text-muted-foreground">
          CthuTool Web
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-normal">
          Something went wrong
        </h1>
        <button
          className="mt-6 rounded-md border border-border px-4 py-2 text-sm font-medium"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
