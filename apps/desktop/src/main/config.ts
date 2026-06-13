import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname } from 'node:path';

export type DesktopEnvironmentProfile = {
  readonly id: string;
  readonly label: string;
  readonly backendUrl: string;
  readonly packagedDefault?: boolean;
};

export type DesktopAppearanceMode = 'system' | 'light' | 'dark';
export type DesktopColorScheme = 'dracula';

export type DesktopAppearance = {
  readonly mode: DesktopAppearanceMode;
  readonly colorScheme: DesktopColorScheme;
};

export type DesktopWindowState = {
  readonly x?: number;
  readonly y?: number;
  readonly width: number;
  readonly height: number;
  readonly isMaximized: boolean;
};

export type DesktopConfig = {
  readonly backendUrl: string;
  readonly agentId: string;
  readonly deviceName: string;
  readonly connectionEnabled: boolean;
  readonly environmentProfiles: readonly DesktopEnvironmentProfile[];
  readonly activeEnvironmentId: string;
  readonly activeEnvironment: DesktopEnvironmentProfile;
  readonly appearance: DesktopAppearance;
  readonly windowState?: DesktopWindowState;
};

export type DesktopConfigPatch = Partial<
  Pick<
    DesktopConfig,
    | 'backendUrl'
    | 'deviceName'
    | 'connectionEnabled'
    | 'environmentProfiles'
    | 'activeEnvironmentId'
    | 'appearance'
    | 'windowState'
  >
>;

export type DesktopConfigStorage = {
  readonly read: () => Partial<DesktopConfig> | undefined;
  readonly write: (config: DesktopConfig) => void;
};

type DesktopConfigDefaults = {
  readonly isPackaged?: boolean;
};

export const DEFAULT_BACKEND_URL = 'http://localhost:3000';
export const DEFAULT_APPEARANCE: DesktopAppearance = {
  mode: 'dark',
  colorScheme: 'dracula',
};

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
  constructor(
    private readonly storage: DesktopConfigStorage,
    private readonly defaults: DesktopConfigDefaults = {},
  ) {}

  load(): DesktopConfig {
    const raw = this.storage.read();
    const config = normalizeConfig(raw, this.defaults);
    if (!raw?.agentId || !raw.environmentProfiles) {
      this.storage.write(config);
    }
    return config;
  }

  savePatch(patch: DesktopConfigPatch): DesktopConfig {
    const next = normalizeConfig(
      mergeConfigPatch(this.load(), patch),
      this.defaults,
    );
    this.storage.write(next);
    return next;
  }
}

export function normalizeConfig(
  input: Partial<DesktopConfig> | undefined,
  defaults: DesktopConfigDefaults = {},
): DesktopConfig {
  const environmentProfiles = normalizeEnvironmentProfiles(input, defaults);
  const activeEnvironmentId = normalizeActiveEnvironmentId(
    input?.activeEnvironmentId,
    environmentProfiles,
  );
  const activeEnvironment =
    environmentProfiles.find((profile) => profile.id === activeEnvironmentId) ??
    environmentProfiles[0];

  return {
    backendUrl: activeEnvironment.backendUrl,
    agentId: normalizeText(input?.agentId) ?? `agent-${randomUUID()}`,
    deviceName: normalizeText(input?.deviceName) ?? hostname(),
    connectionEnabled: input?.connectionEnabled ?? true,
    environmentProfiles,
    activeEnvironmentId: activeEnvironment.id,
    activeEnvironment,
    appearance: normalizeAppearance(input?.appearance),
    windowState: normalizeWindowState(input?.windowState),
  };
}

function normalizeEnvironmentProfiles(
  input: Partial<DesktopConfig> | undefined,
  defaults: DesktopConfigDefaults,
): readonly DesktopEnvironmentProfile[] {
  const defaultProfiles = defaultEnvironmentProfiles(defaults);
  const migratedBackendUrl = normalizeText(input?.backendUrl);
  const source =
    input?.environmentProfiles && input.environmentProfiles.length > 0
      ? input.environmentProfiles
      : defaultProfiles;
  const profiles = source.map((profile, index) => {
    const fallback = defaultProfiles[index] ?? defaultProfiles[0];
    return {
      id: normalizeText(profile.id) ?? fallback.id,
      label: normalizeText(profile.label) ?? fallback.label,
      backendUrl: normalizeBackendUrl(
        index === 0 && migratedBackendUrl
          ? migratedBackendUrl
          : profile.backendUrl,
      ),
      packagedDefault: profile.packagedDefault,
    };
  });

  return profiles.length > 0 ? profiles : defaultProfiles;
}

function defaultEnvironmentProfiles(
  defaults: DesktopConfigDefaults,
): readonly DesktopEnvironmentProfile[] {
  if (defaults.isPackaged) {
    return [
      {
        id: 'test',
        label: 'Test',
        backendUrl: normalizeBackendUrl(
          process.env.CTHUDESKTOP_TEST_BACKEND_URL,
        ),
        packagedDefault: true,
      },
      {
        id: 'production',
        label: 'Production',
        backendUrl: normalizeBackendUrl(
          process.env.CTHUDESKTOP_PRODUCTION_BACKEND_URL,
        ),
        packagedDefault: true,
      },
    ];
  }

  return [
    {
      id: 'local',
      label: 'Local',
      backendUrl: DEFAULT_BACKEND_URL,
    },
  ];
}

function normalizeActiveEnvironmentId(
  input: string | undefined,
  profiles: readonly DesktopEnvironmentProfile[],
): string {
  const value = normalizeText(input);
  const fallbackId = profiles[0]?.id ?? 'local';
  return value && profiles.some((profile) => profile.id === value)
    ? value
    : fallbackId;
}

function normalizeAppearance(
  input: DesktopAppearance | undefined,
): DesktopAppearance {
  const mode =
    input?.mode === 'system' ||
    input?.mode === 'light' ||
    input?.mode === 'dark'
      ? input.mode
      : DEFAULT_APPEARANCE.mode;

  return {
    mode,
    colorScheme: 'dracula',
  };
}

function normalizeWindowState(
  input: DesktopWindowState | undefined,
): DesktopWindowState | undefined {
  if (!input) return undefined;
  return {
    x: typeof input.x === 'number' ? input.x : undefined,
    y: typeof input.y === 'number' ? input.y : undefined,
    width: Math.max(860, Math.round(input.width || 1120)),
    height: Math.max(600, Math.round(input.height || 760)),
    isMaximized: Boolean(input.isMaximized),
  };
}

function mergeConfigPatch(
  current: DesktopConfig,
  patch: DesktopConfigPatch,
): Partial<DesktopConfig> {
  const backendUrl = patch.backendUrl;
  if (!backendUrl) {
    return { ...current, ...patch };
  }

  const targetEnvironmentId =
    patch.activeEnvironmentId ?? current.activeEnvironmentId;

  return {
    ...current,
    ...patch,
    environmentProfiles: current.environmentProfiles.map((profile) =>
      profile.id === targetEnvironmentId ? { ...profile, backendUrl } : profile,
    ),
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
