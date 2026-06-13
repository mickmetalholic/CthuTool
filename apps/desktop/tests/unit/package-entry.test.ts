import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('desktop package entry', () => {
  test('points Electron to the electron-vite output entry', () => {
    const packageJsonPath = resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      main: string;
    };

    expect(packageJson.main).toBe('out/main/index.js');
  });

  test('source entry exists for the configured Electron main output', () => {
    const packageJsonPath = resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      main: string;
    };

    expect(packageJson.main).toBe('out/main/index.js');
    expect(existsSync(resolve(__dirname, '../../src/main/index.ts'))).toBe(
      true,
    );
  });
});
