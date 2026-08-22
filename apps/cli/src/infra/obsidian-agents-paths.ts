import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export type ObsidianAgentsDataPathOptions = {
  readonly dataRoot?: string;
  readonly homeRoot?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly platform?: NodeJS.Platform;
};

export type ObsidianAgentsDataPaths = {
  readonly dataRoot: string;
  readonly configPath: string;
  readonly locksRoot: string;
};

export function resolveCthuToolChcDataRoot(
  options: ObsidianAgentsDataPathOptions = {},
): string {
  const env = options.env ?? process.env;
  const explicit = options.dataRoot?.trim() || env.CTHUTOOL_CHC_DATA_DIR;
  if (explicit?.trim()) return resolve(explicit);

  const homeRoot = options.homeRoot ?? homedir();
  const platform = options.platform ?? process.platform;
  if (platform === 'win32') {
    return resolve(
      join(
        env.APPDATA ?? join(homeRoot, 'AppData', 'Roaming'),
        'CthuTool',
        'chc',
      ),
    );
  }
  if (platform === 'darwin') {
    return resolve(
      join(homeRoot, 'Library', 'Application Support', 'CthuTool', 'chc'),
    );
  }
  return resolve(
    join(
      env.XDG_STATE_HOME ?? join(homeRoot, '.local', 'state'),
      'cthutool',
      'chc',
    ),
  );
}

export function createObsidianAgentsDataPaths(
  options: ObsidianAgentsDataPathOptions = {},
): ObsidianAgentsDataPaths {
  const dataRoot = resolveCthuToolChcDataRoot(options);
  return {
    dataRoot,
    configPath: join(dataRoot, 'obsidian-agents.json'),
    locksRoot: join(dataRoot, 'locks'),
  };
}
