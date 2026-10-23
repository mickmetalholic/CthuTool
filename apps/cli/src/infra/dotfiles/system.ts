import { spawn } from 'node:child_process';
import type { Stats } from 'node:fs';
import { access, constants, readFile } from 'node:fs/promises';
import { homedir, release } from 'node:os';
import { delimiter, join } from 'node:path';
import type { HostOS } from '../../domain/dotfiles/model';
import { resolveNodeCommand } from '../node-command';
export type CommandResult = { code: number; stdout: string; stderr: string };
export type HttpFetch = (
  ...args: Parameters<typeof fetch>
) => ReturnType<typeof fetch>;
export type DotfilesSystem = {
  home: string;
  environment?: NodeJS.ProcessEnv;
  os: HostOS;
  wsl: boolean;
  arch: string;
  run: (
    command: string,
    args: string[],
    options?: {
      cwd?: string;
      env?: NodeJS.ProcessEnv;
      input?: string;
      live?: boolean;
    },
  ) => Promise<CommandResult>;
  which: (command: string) => Promise<string | undefined>;
  fetch: HttpFetch;
  files?: {
    stat: (path: string) => Promise<Stats>;
    readText: (path: string) => Promise<string>;
    access: (path: string, mode?: number) => Promise<void>;
  };
};
export function createDotfilesSystem(home = homedir()): DotfilesSystem {
  return {
    home,
    environment: process.env,
    os: process.platform === 'win32' ? 'windows' : (process.platform as HostOS),
    wsl:
      process.platform === 'linux' &&
      (/microsoft/i.test(release()) || !!process.env.WSL_DISTRO_NAME),
    arch: process.arch,
    fetch: globalThis.fetch,
    async which(command) {
      for (const dir of [
        ...(process.env.PATH ?? '').split(delimiter),
        join(home, '.local/bin'),
      ])
        for (const ext of process.platform === 'win32'
          ? ['', '.exe', '.cmd', '.bat']
          : ['']) {
          const p = join(dir, command + ext);
          try {
            await access(p, constants.X_OK);
            return p;
          } catch {}
        }
      return undefined;
    },
    run(command, args, options = {}) {
      return new Promise((resolve, reject) => {
        const invocation = resolveNodeCommand(
          command,
          command === 'sudo' && !options.live ? ['-n', ...args] : args,
        );
        const environment = { ...(options.env ?? process.env) };
        delete environment.NOTION_TOKEN;
        environment.PATH = `${environment.PATH ?? ''}${delimiter}${join(home, '.local/bin')}`;
        const p = spawn(invocation.command, invocation.args, {
          cwd: options.cwd,
          env: environment,
          windowsHide: true,
          stdio: [options.live ? 'inherit' : 'pipe', 'pipe', 'pipe'],
        });
        const timer = setTimeout(() => p.kill('SIGTERM'), 300000);
        timer.unref();
        let stdout = '';
        let stderr = '';
        p.stdout?.on('data', (c) => {
          stdout += c;
          if (options.live) process.stderr.write(c);
        });
        p.stderr?.on('data', (c) => {
          stderr += c;
          if (options.live) process.stderr.write(c);
        });
        p.on('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });
        p.on('close', (code) => {
          clearTimeout(timer);
          resolve({ code: code ?? 1, stdout, stderr });
        });
        p.stdin?.end(options.input);
      });
    },
  };
}
export async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw e;
  }
}
export async function checkedRun(
  system: DotfilesSystem,
  command: string,
  args: string[],
  options?: Parameters<DotfilesSystem['run']>[2],
) {
  const r = await system.run(command, args, options);
  if (r.code !== 0)
    throw new Error(
      `${command} failed (${r.code}): ${r.stderr.slice(0, 2000)}`,
    );
  return r.stdout;
}
