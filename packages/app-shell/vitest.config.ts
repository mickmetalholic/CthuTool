import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'html', 'json-summary'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        statements: 50,
        branches: 65,
        functions: 35,
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@cthutool/ui': new URL('../../packages/ui/src/index.ts', import.meta.url)
        .pathname,
    },
  },
});
