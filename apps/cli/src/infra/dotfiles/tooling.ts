import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { checkedRun, type DotfilesSystem } from './system';
export type ToolPreparation = {
  tool: 'chezmoi' | 'mise';
  path: string;
  status: 'reused' | 'installed';
  version?: string;
  installer?: 'winget' | 'Homebrew' | 'official installer';
};
export type ToolPreparationEvent =
  | { type: 'tool_check'; tool: ToolPreparation['tool'] }
  | {
      type: 'tool_install';
      tool: ToolPreparation['tool'];
      installer: NonNullable<ToolPreparation['installer']>;
    }
  | { type: 'tool_ready'; preparation: ToolPreparation };
export async function ensureDotfilesTools(
  system: DotfilesSystem,
  report: (event: ToolPreparationEvent) => void = () => {},
): Promise<ToolPreparation[]> {
  const bin = join(system.home, '.local/bin');
  await mkdir(bin, { recursive: true });
  process.env.PATH = `${bin}${delimiter}${process.env.PATH ?? ''}`;
  const tools: ToolPreparation[] = [];
  for (const tool of ['chezmoi', 'mise'] as const) {
    report({ type: 'tool_check', tool });
    const existing = await system.which(tool);
    let installer: ToolPreparation['installer'];
    if (!existing) {
      installer =
        system.os === 'windows'
          ? 'winget'
          : (await system.which('brew'))
            ? 'Homebrew'
            : 'official installer';
      report({ type: 'tool_install', tool, installer });
      if (system.os === 'windows') {
        await checkedRun(system, 'winget', [
          'install',
          '--exact',
          '--id',
          tool === 'chezmoi' ? 'twpayne.chezmoi' : 'jdx.mise',
          '--scope',
          'user',
          '--accept-source-agreements',
          '--accept-package-agreements',
          '--disable-interactivity',
        ]);
      } else if (installer === 'Homebrew')
        await checkedRun(system, 'brew', ['install', tool]);
      else {
        const temp = await mkdtemp(join(tmpdir(), 'chc-tooling-'));
        try {
          const response = await system.fetch(
            tool === 'chezmoi' ? 'https://get.chezmoi.io' : 'https://mise.run',
            { signal: AbortSignal.timeout(60000) },
          );
          if (!response.ok)
            throw new Error(`Cannot download official ${tool} installer`);
          const script = join(temp, 'install.sh');
          await writeFile(
            script,
            new Uint8Array(await response.arrayBuffer()),
            {
              mode: 0o600,
            },
          );
          await checkedRun(
            system,
            'sh',
            [script, ...(tool === 'chezmoi' ? ['-b', bin] : [])],
            {
              env: {
                ...process.env,
                HOME: system.home,
                MISE_INSTALL_PATH: join(bin, 'mise'),
              },
            },
          );
        } finally {
          await rm(temp, { recursive: true, force: true });
        }
      }
    }
    const path = existing ?? (await system.which(tool));
    if (!path)
      throw new Error(
        `${tool} installation finished but its user launcher is not on PATH. Open a new terminal and rerun chc dotfiles init.`,
      );
    // Version display is observational; the source's .chezmoiversion owns compatibility checks.
    let version: string | undefined;
    try {
      const result = await system.run(tool, ['--version']);
      if (result.code === 0)
        version =
          result.stdout.trim().split(/\r?\n/)[0]?.slice(0, 200) || undefined;
    } catch {
      /* Availability can succeed even when a version probe is unsupported. */
    }
    const preparation: ToolPreparation = {
      tool,
      path,
      status: existing ? 'reused' : 'installed',
      version,
      installer,
    };
    report({ type: 'tool_ready', preparation });
    tools.push(preparation);
  }
  return tools;
}
