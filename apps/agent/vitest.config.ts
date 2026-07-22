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
      '@cthutool/agent-runtime': new URL(
        '../../packages/agent-runtime/src/index.ts',
        import.meta.url,
      ).pathname,
    },
  },
});
