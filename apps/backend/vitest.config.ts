import { fileURLToPath } from 'node:url';
import { transform } from '@swc/core';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

function nestTypeScriptTransform(): Plugin {
  return {
    name: 'cthutool-backend-nest-swc',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.endsWith('.ts') || id.includes('/node_modules/')) {
        return null;
      }

      const output = await transform(code, {
        filename: id,
        sourceMaps: true,
        jsc: {
          parser: {
            decorators: true,
            syntax: 'typescript',
          },
          target: 'es2022',
          transform: {
            decoratorMetadata: true,
            legacyDecorator: true,
            useDefineForClassFields: false,
          },
        },
        module: {
          type: 'es6',
        },
      });

      return {
        code: output.code,
        map: output.map ? JSON.parse(output.map) : null,
      };
    },
  };
}

export default defineConfig({
  plugins: [nestTypeScriptTransform()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'e2e/**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.d.ts'],
      thresholds: {
        statements: 75,
        branches: 70,
        functions: 80,
        lines: 75,
      },
    },
  },
  resolve: {
    alias: {
      '@cthutool/agent-protocol': fileURLToPath(
        new URL('../../packages/agent-protocol/src/index.ts', import.meta.url),
      ),
      '@cthutool/browser-runtime-protocol': fileURLToPath(
        new URL(
          '../../packages/browser-runtime-protocol/src/index.ts',
          import.meta.url,
        ),
      ),
      '@cthutool/config': fileURLToPath(
        new URL('../../packages/config/src/index.ts', import.meta.url),
      ),
    },
  },
});
