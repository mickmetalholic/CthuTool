import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { checkedRun, type DotfilesSystem } from './system';
export async function ensureDotfilesTools(system: DotfilesSystem) {
  const bin = join(system.home, '.local/bin');
  await mkdir(bin, { recursive: true });
  process.env.PATH = `${bin}${delimiter}${process.env.PATH ?? ''}`;
  for (const tool of ['chezmoi', 'mise']) {
    if (await system.which(tool)) continue;
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
    } else if (await system.which('brew'))
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
        await writeFile(script, new Uint8Array(await response.arrayBuffer()), {
          mode: 0o600,
        });
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
    if (!(await system.which(tool)))
      throw new Error(
        `${tool} installation finished but its user launcher is not on PATH. Open a new terminal and rerun chc dotfiles init.`,
      );
  }
}
