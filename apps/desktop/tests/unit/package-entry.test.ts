import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('desktop package entry', () => {
  const packageJsonPath = resolve(__dirname, '../../package.json');

  test('points Electron to the electron-vite output entry', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      main: string;
    };

    expect(packageJson.main).toBe('out/main/index.js');
  });

  test('source entry exists for the configured Electron main output', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      main: string;
    };

    expect(packageJson.main).toBe('out/main/index.js');
    expect(existsSync(resolve(__dirname, '../../src/main/index.ts'))).toBe(
      true,
    );
  });

  test('uses CthuDesktop identity and icon build resources', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      build: {
        npmRebuild: boolean;
        productName: string;
        directories: { buildResources: string };
        mac: { icon: string };
        win: { icon: string };
      };
    };

    expect(packageJson.build.productName).toBe('CthuDesktop');
    expect(packageJson.build.npmRebuild).toBe(false);
    expect(packageJson.build.directories.buildResources).toBe('build');
    expect(packageJson.build.mac.icon).toBe('build/icon.png');
    expect(packageJson.build.win.icon).toBe('build/icon.png');
    expect(existsSync(resolve(__dirname, '../../build/icon.svg'))).toBe(true);
    expect(existsSync(resolve(__dirname, '../../build/icon.png'))).toBe(true);
  });
});
