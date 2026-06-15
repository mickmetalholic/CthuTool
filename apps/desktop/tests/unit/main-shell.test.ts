import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('desktop main shell contract', () => {
  const mainSource = readFileSync(
    resolve(__dirname, '../../src/main/index.ts'),
    'utf8',
  );

  test('creates an app-owned frameless CthuDesktop window', () => {
    expect(mainSource).toContain("title: 'CthuDesktop'");
    expect(mainSource).toContain(
      "app.setAppUserModelId('dev.cthutool.desktop')",
    );
    expect(mainSource).toContain(
      "icon: join(app.getAppPath(), 'build', 'icon.png')",
    );
    expect(mainSource).toContain('frame: false');
    expect(mainSource).toContain('contextIsolation: true');
    expect(mainSource).toContain("backgroundColor: '#282a36'");
  });

  test('exposes window action IPC controls', () => {
    expect(mainSource).toMatch(/ipcMain\.handle\(\s*'desktop:windowAction'/);
    expect(mainSource).toContain("action === 'minimize'");
    expect(mainSource).toContain("action === 'maximize'");
    expect(mainSource).toContain("action === 'close'");
  });

  test('persists window state through config storage', () => {
    expect(mainSource).toContain('persistWindowState');
    expect(mainSource).toContain('windowState');
    expect(mainSource).toContain('isMaximized');
    expect(mainSource).toContain('getNormalBounds');
    expect(mainSource).toContain('configStore.savePatch');
    expect(mainSource).toContain('mainWindow.isDestroyed()');
    expect(mainSource).toContain("mainWindow.on('close', persistWindowState)");
    expect(mainSource).toContain("mainWindow.on('resize', persistWindowState)");
    expect(mainSource).toContain("mainWindow.on('move', persistWindowState)");
    expect(mainSource).toContain(
      "mainWindow.on('maximize', persistWindowState)",
    );
    expect(mainSource).toContain(
      "mainWindow.on('unmaximize', persistWindowState)",
    );
    expect(mainSource).toContain("mainWindow.on('closed'");
  });

  test('exposes local data paths in app info', () => {
    expect(mainSource).toContain(
      "browserProfilesDir: join(app.getPath('userData'), 'browser-profiles')",
    );
    expect(mainSource).toContain(
      "configPath: join(app.getPath('userData'), 'config.json')",
    );
    expect(mainSource).toContain("userDataDir: app.getPath('userData')");
  });

  test('publishes local browser state through the agent snapshot channel', () => {
    expect(mainSource).toContain('publishLocalBrowserState');
    expect(mainSource).toContain('agentClient?.sendBrowserStateSnapshot()');
    expect(mainSource).toContain(
      'getBrowserStateSnapshot: buildBrowserStateSnapshot',
    );
    expect(mainSource).toContain('profileStore.listProfiles()');
    expect(mainSource).toContain(
      "task.status === 'open' || task.status === 'in_progress'",
    );
  });
});
