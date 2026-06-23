import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@renderer': new URL('./src/renderer/src', import.meta.url).pathname,
      '@main': new URL('./src/main', import.meta.url).pathname,
      '@cthutool/app-shell': new URL(
        '../../packages/app-shell/src/index.ts',
        import.meta.url,
      ).pathname,
      '@cthutool/ui': new URL('../../packages/ui/src/index.ts', import.meta.url)
        .pathname,
    },
  },
});
