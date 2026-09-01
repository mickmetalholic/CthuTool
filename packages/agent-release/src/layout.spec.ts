import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  createBundleLayout,
  validateBundleInventory,
  validateBundleLayout,
} from './layout';

function validInventory() {
  const layout = createBundleLayout('darwin-arm64', '1.2.3');
  return [
    'layout.json',
    layout.entryPoints.tray,
    layout.entryPoints.setup,
    layout.entryPoints.node,
    layout.entryPoints.agent,
    'agent/node_modules/playwright/package.json',
    'agent/node_modules/playwright-core/package.json',
    'licenses/NODE_LICENSE',
    'licenses/THIRD_PARTY_NOTICES.txt',
    'licenses/LICENSE-SLINT.md',
    'bin/CthuTool Agent.app/Contents/Info.plist',
  ];
}

describe('Agent bundle layout', () => {
  test('validates the exact versioned layout fixture', async () => {
    const layout = createBundleLayout('windows-x64', '1.2.3');
    expect(validateBundleLayout(layout)).toEqual(layout);
    expect(
      validateBundleLayout(
        JSON.parse(
          await readFile(
            resolve(__dirname, '../fixtures/layout.darwin-arm64.v1.json'),
            'utf8',
          ),
        ),
      ),
    ).toEqual(createBundleLayout('darwin-arm64', '1.2.3'));
    expect(() =>
      validateBundleLayout({
        ...layout,
        entryPoints: { ...layout.entryPoints, agent: 'agent/index.js' },
      }),
    ).toThrow(/entry points/);
  });

  test('accepts required UI-free immutable inventory with native setup', () => {
    expect(validateBundleInventory('darwin-arm64', validInventory())).toEqual(
      [...validInventory()].sort(),
    );
  });

  test.each([
    'desktop/renderer.js',
    'web/index.html',
    'agent/renderer/index.js',
    'frameworks/EmbeddedWebView.framework/runtime',
    'electron/Electron Framework',
    'settings.css',
    'ui/app.tsx',
    'webview/runtime',
    'agent/environments.json',
  ])('rejects UI runtime, catalog, or application asset %s', (path) => {
    expect(() =>
      validateBundleInventory('darwin-arm64', [...validInventory(), path]),
    ).toThrow(/local UI runtime or assets|deployment URL catalog/);
  });

  test.each([
    'environment.json',
    'environments/prod/agent-secret',
    'browser-profiles/profile/data',
    'logs/agent.log',
    'config.json',
    'runtime/instance.json',
  ])('rejects mutable data %s from version contents', (path) => {
    expect(() =>
      validateBundleInventory('darwin-arm64', [...validInventory(), path]),
    ).toThrow(/Mutable Agent data/);
  });

  test('rejects traversal before extraction', () => {
    expect(() =>
      validateBundleInventory('darwin-arm64', [
        ...validInventory(),
        '../outside',
      ]),
    ).toThrow(/Unsafe Agent archive path/);
  });
});
