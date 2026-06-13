import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname } from 'node:path';

export type DesktopConfig = {
  readonly backendUrl: string;
  readonly agentId: string;
  readonly deviceName: string;
  readonly connectionEnabled: boolean;
};

export type DesktopConfigPatch = Partial<
  Pick<DesktopConfig, 'backendUrl' | 'deviceName' | 'connectionEnabled'>
>;

export type DesktopConfigStorage = {
  readonly read: () => Partial<DesktopConfig> | undefined;
  readonly write: (config: DesktopConfig) => void;
};

export const DEFAULT_BACKEND_URL = 'http://localhost:3000';

export class JsonDesktopConfigStorage implements DesktopConfigStorage {
  constructor(private readonly filePath: string) {}

  read(): Partial<DesktopConfig> | undefined {
    if (!existsSync(this.filePath)) {
      return undefined;
    }
    return JSON.parse(
      readFileSync(this.filePath, 'utf8'),
    ) as Partial<DesktopConfig>;
  }

  write(config: DesktopConfig): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(
      this.filePath,
      `${JSON.stringify(config, null, 2)}\n`,
      'utf8',
    );
  }
}

export class DesktopConfigStore {
  constructor(private readonly storage: DesktopConfigStorage) {}

  load(): DesktopConfig {
    const raw = this.storage.read();
    const config = normalizeConfig(raw);
    if (!raw?.agentId) {
      this.storage.write(config);
    }
    return config;
  }

  savePatch(patch: DesktopConfigPatch): DesktopConfig {
    const next = normalizeConfig({ ...this.load(), ...patch });
    this.storage.write(next);
    return next;
  }
}

export function normalizeConfig(
  input: Partial<DesktopConfig> | undefined,
): DesktopConfig {
  return {
    backendUrl: normalizeBackendUrl(input?.backendUrl),
    agentId: normalizeText(input?.agentId) ?? `agent-${randomUUID()}`,
    deviceName: normalizeText(input?.deviceName) ?? hostname(),
    connectionEnabled: true,
  };
}

function normalizeBackendUrl(input: string | undefined): string {
  const value = normalizeText(input) ?? DEFAULT_BACKEND_URL;
  return value.replace(/\/+$/, '');
}

function normalizeText(input: string | undefined): string | undefined {
  const value = input?.trim();
  return value ? value : undefined;
}
