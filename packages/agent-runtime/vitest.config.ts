import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@cthutool/agent-bridge-protocol': new URL(
        '../agent-bridge-protocol/src/index.ts',
        import.meta.url,
      ).pathname,
      '@cthutool/agent-protocol': new URL(
        '../agent-protocol/src/index.ts',
        import.meta.url,
      ).pathname,
      '@cthutool/browser-runtime-protocol': new URL(
        '../browser-runtime-protocol/src/index.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
