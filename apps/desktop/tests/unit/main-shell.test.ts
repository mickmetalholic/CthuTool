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
    expect(mainSource).toContain('configStore.savePatch');
    expect(mainSource).toContain('mainWindow.isDestroyed()');
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

  test('syncs local browser state after agent registration', () => {
    expect(mainSource).toContain('reportLocalBrowserStateToBackend');
    expect(mainSource).toContain('onRegistered: (state)');
    expect(mainSource).toContain('profileStore.listProfiles()');
    expect(mainSource).toContain(
      "task.status === 'open' || task.status === 'in_progress'",
    );
  });
});
