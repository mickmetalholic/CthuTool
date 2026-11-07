import { afterEach, expect, test } from 'bun:test';
import { execFile, execFileSync } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import {
  adoptFiles,
  applyConfiguration,
  type ConfigInteraction,
  saveBinding,
} from '../../src/domain/dotfiles/configuration';
import { loadSnapshot, readBinding } from '../../src/infra/dotfiles/source';
import {
  createDotfilesSystem,
  type DotfilesSystem,
} from '../../src/infra/dotfiles/system';

const exec = promisify(execFile);
const node = execFileSync('node', ['-p', 'process.execPath'], {
  encoding: 'utf8',
}).trim();
const root = resolve(import.meta.dir, '../../../..');
const entry = join(root, 'apps/cli/bin/chc.mjs');
const machine = createDotfilesSystem();
// Real chezmoi and CLI subprocesses must agree with the fixture's platform.
const host =
  machine.os === 'windows'
    ? 'windows-desktop'
    : machine.os === 'darwin'
      ? 'darwin-macbook-pro'
      : machine.wsl
        ? 'linux-wsl'
        : 'linux-ubuntu-server';
const otherHost = machine.os === 'darwin' ? 'darwin-mac-mini' : host;
const shell = machine.os === 'darwin' || machine.wsl ? 'zsh' : 'bash';
const dirs: string[] = [];
async function temporary() {
  const p = await mkdtemp(join(tmpdir(), 'chc-config-integration-'));
  dirs.push(p);
  return realpath(p);
}
afterEach(async () => {
  for (const d of dirs.splice(0)) await rm(d, { recursive: true, force: true });
});
const env = (home: string) => ({
  ...process.env,
  HOME: home,
  USERPROFILE: home,
  XDG_CONFIG_HOME: join(home, '.config'),
  XDG_DATA_HOME: join(home, '.local/share'),
  XDG_CACHE_HOME: join(home, '.cache'),
  NOTION_TOKEN: '',
});
async function cli(args: string[], home: string) {
  try {
    return {
      code: 0,
      ...(await exec(node, [entry, ...args], {
        env: env(home),
        cwd: home,
      })),
    };
  } catch (e) {
    const r = e as { code: number; stdout: string; stderr: string };
    return r;
  }
}
test('bare groups/help/completion and offline validate work from another cwd without auth or writes', async () => {
  const home = await temporary();
  for (const path of [[], ['env'], ['config'], ['notion']]) {
    const r = await cli(['dotfiles', ...path], home);
    expect({ code: r.code, stderr: r.stderr }).toEqual({ code: 0, stderr: '' });
    expect(r.stdout).toContain('USAGE');
    expect(r.stdout).not.toContain('Token missing');
  }
  const r = await cli(
    ['dotfiles', 'notion', 'validate', '--source', root, '--json'],
    home,
  );
  expect(r.code).toBe(0);
  expect(JSON.parse(r.stdout).result.hosts).toHaveLength(5);
  const dry = await cli(
    ['dotfiles', 'env', 'setup', '--host', host, '--dry-run', '--json'],
    home,
  );
  expect(dry.code).toBe(0);
  expect(JSON.parse(dry.stdout).result.dryRun).toBe(true);
  const missing = await cli(
    ['dotfiles', 'notion', 'diff', '--source', root, '--json'],
    home,
  );
  expect(missing.code).not.toBe(0);
  expect(JSON.parse(missing.stdout).error.code).toBe('notion_auth_required');
  expect(missing.stdout.trim().split('\n')).toHaveLength(1);
  for (const obsolete of [
    '--snapshot=x',
    '--direct-api',
    '--token=SHOULD_NOT_APPEAR',
  ]) {
    const r = await cli(
      ['dotfiles', 'notion', 'diff', '--source', root, '--json', obsolete],
      home,
    );
    expect(r.code).not.toBe(0);
    expect(r.stdout).not.toContain('SHOULD_NOT_APPEAR');
  }
  const complete = await cli(['__complete', 'dotfiles', ''], home);
  expect(complete.stdout).toContain('notion');
  const { readdir } = await import('node:fs/promises');
  expect(await readdir(home)).toEqual([]);
});
// Optional real renderer: CI can provide a verified temporary binary. Never install a tool globally.
const binary = process.env.CHC_TEST_CHEZMOI;
const rendererTest = binary ? test : test.skip;
async function renderer() {
  const home = await temporary();
  const source = await temporary();
  await cp(join(root, 'dotfiles'), join(source, 'dotfiles'), {
    recursive: true,
  });
  for (const f of ['.chezmoiroot', '.chezmoiversion'])
    await cp(join(root, f), join(source, f));
  const configFile = join(home, '.config/chezmoi/chezmoi.toml');
  const calls: string[][] = [];
  const base = createDotfilesSystem();
  const system: DotfilesSystem = {
    ...base,
    home,
    environment: env(home),
    run: async (command, args, options) => {
      if (command !== 'chezmoi')
        throw new Error(`Unexpected side-effect command ${command}`);
      calls.push(args);
      try {
        const pending = exec(
          binary as string,
          [
            ...(!args.includes('--config') ? ['--config', configFile] : []),
            ...(options?.terminal ? ['--no-tty'] : []),
            ...args,
          ],
          { env: env(home) },
        );
        if (options?.terminal && args.includes('apply'))
          pending.child.stdin?.end('a\n');
        const r = await pending;
        return { code: 0, ...r };
      } catch (e) {
        const r = e as { code: number; stdout: string; stderr: string };
        if (r.code !== 0) r.stderr = `${JSON.stringify(args)}: ${r.stderr}`;
        return r;
      }
    },
    which: async (c) => (c === 'chezmoi' ? binary : undefined),
    fetch: async () => {
      throw new Error('Unexpected network');
    },
  };
  const interaction: ConfigInteraction = {
    selectHost: async () => undefined,
    chooseFiles: async () => [],
  };
  return { home, source, system, interaction, calls, configFile };
}
rendererTest(
  'native add/merge preserve templates and home, apply uses chezmoi state without receipts',
  async () => {
    const { home, source, system, interaction, calls, configFile } =
      await renderer();
    const { catalog } = await loadSnapshot(source);
    await saveBinding(system, {
      source,
      host,
      interactive: false,
      interaction,
      catalog,
    });
    await writeFile(
      join(home, '.gitconfig'),
      '[user]\n name = Existing User\n email = existing@example.invalid\n[include]\n path = custom\n',
    );
    const file = join(home, '.example');
    await writeFile(file, 'local content');
    await adoptFiles(system, source, host, [file], false);
    expect(
      await readFile(join(source, 'dotfiles/home/dot_example'), 'utf8'),
    ).toBe('local content');
    const profile = join(home, `.${shell}rc`);
    const completion = `# >>> cthutool chc completion >>>\nsource <(chc completion ${shell})\n# <<< cthutool chc completion <<<`;
    const bootstrap =
      '# >>> cthutool bootstrap PATH >>>\nexport PATH="$HOME/.cthutool/bin:$PATH"\n# <<< cthutool bootstrap PATH <<<';
    await writeFile(
      profile,
      `# local customization\n${completion}\n${bootstrap}\n`,
    );
    await expect(applyConfiguration(system, source, host)).rejects.toThrow(
      'chezmoi preflight',
    );
    await expect(readFile(join(home, '.editorconfig'))).rejects.toThrow();
    await expect(
      adoptFiles(system, source, host, [profile], false),
    ).rejects.toThrow('interactive terminal');
    const merger = join(home, 'merge fixture.mjs');
    await writeFile(
      merger,
      "import {readFileSync,appendFileSync} from 'node:fs';if(!readFileSync(process.argv[3],'utf8').includes('local customization'))appendFileSync(process.argv[3],'\\n# local customization\\n');",
    );
    await writeFile(
      configFile,
      (await readFile(configFile, 'utf8')) +
        `\n[merge]\ncommand = ${JSON.stringify(node)}\nargs = [${JSON.stringify(merger)}, "{{ .Destination }}", "{{ .Source }}", "{{ .Target }}"]\n`,
    );
    const before = await readFile(profile, 'utf8');
    await adoptFiles(system, source, host, [profile], true);
    expect(await readFile(profile, 'utf8')).toBe(before);
    const template = await readFile(
      join(source, `dotfiles/home/dot_${shell}rc.tmpl`),
      'utf8',
    );
    expect(template).toContain('{{');
    expect(template).toContain('local customization');
    // The native merge reconciles content; apply remains an explicit separate step.
    const desired = await system.run('chezmoi', [
      '--source',
      source,
      '--destination',
      home,
      '--override-data',
      JSON.stringify({ local: { host } }),
      'cat',
      profile,
    ]);
    await writeFile(profile, desired.stdout);
    await applyConfiguration(system, source, host, true);
    await applyConfiguration(system, source, host);
    expect(
      (await readFile(profile, 'utf8')).match(
        /# >>> cthutool chc completion >>>/g,
      ),
    ).toHaveLength(1);
    expect(
      (await readFile(profile, 'utf8')).match(
        /# >>> cthutool bootstrap PATH >>>/g,
      ),
    ).toHaveLength(1);
    expect(await readFile(join(home, '.gitconfig'), 'utf8')).toContain(
      'Existing User',
    );
    await writeFile(
      join(source, 'dotfiles/home/dot_example'),
      'repository update',
    );
    await applyConfiguration(system, source, host);
    expect(await readFile(file, 'utf8')).toBe('repository update');
    await writeFile(file, 'later local edit');
    await expect(applyConfiguration(system, source, host)).rejects.toThrow(
      'chezmoi preflight',
    );
    expect(await readFile(file, 'utf8')).toBe('later local edit');
    expect(calls.some((a) => a.includes('merge'))).toBe(true);
    expect(calls.some((a) => a.includes('add'))).toBe(true);
    expect(calls.some((a) => a.includes('state'))).toBe(false);
    expect(calls.some((a) => a.includes('--force'))).toBe(false);
    const { readdir } = await import('node:fs/promises');
    const states = join(home, '.cthutool/state/dotfiles');
    for (const dir of await readdir(states))
      expect(await readdir(join(states, dir))).not.toContain('receipts.json');
  },
);
rendererTest(
  'all five host templates use target OS/shell/terminal without old identity overrides',
  async () => {
    const { home, source, system } = await renderer();
    const { catalog } = await loadSnapshot(source);
    for (const [id, h] of Object.entries(catalog.hosts)) {
      const raw = await system.run('chezmoi', [
        '--source',
        source,
        '--destination',
        home,
        '--override-data',
        JSON.stringify({ local: { host: id }, chezmoi: { os: h.os } }),
        'managed',
        '--include',
        'files,symlinks',
        '--path-style',
        'absolute',
        '--nul-path-separator',
      ]);
      expect(raw.code).toBe(0);
      const targets = raw.stdout.split('\0').filter(Boolean);
      expect(targets.some((t) => t.endsWith('.gitconfig'))).toBe(false);
      expect(targets.some((t) => t.endsWith('.zshrc'))).toBe(h.shell === 'zsh');
      expect(targets.some((t) => t.endsWith('.bashrc'))).toBe(
        h.shell === 'bash',
      );
      expect(
        targets.some((t) => t.endsWith('Microsoft.PowerShell_profile.ps1')),
      ).toBe(h.shell === 'pwsh');
      for (const target of targets) {
        const r = await system.run('chezmoi', [
          '--source',
          source,
          '--destination',
          home,
          '--override-data',
          JSON.stringify({ local: { host: id }, chezmoi: { os: h.os } }),
          'cat',
          target,
        ]);
        expect(r.code).toBe(0);
        expect(r.stdout).not.toContain('yuanshenmick@gmail.com');
      }
    }
  },
);

rendererTest(
  'explicit source migration preserves backup and binding; relocated CLI keeps fixed source and fails without fallback',
  async () => {
    const { home, source, system, interaction, configFile } = await renderer();
    const { catalog } = await loadSnapshot(source);
    await saveBinding(system, {
      source,
      host,
      interactive: false,
      interaction,
      catalog,
    });
    const before = await readFile(configFile, 'utf8');
    const other = await temporary();
    await cp(join(source, 'dotfiles'), join(other, 'dotfiles'), {
      recursive: true,
    });
    for (const f of ['.chezmoiroot', '.chezmoiversion', 'package.json'])
      await cp(join(root, f), join(other, f));
    await expect(
      saveBinding(system, {
        source: other,
        host,
        interactive: false,
        interaction,
        catalog,
      }),
    ).rejects.toThrow('--migrate-from');
    expect(await readFile(configFile, 'utf8')).toBe(before);
    await expect(
      saveBinding(system, {
        source: other,
        host:
          machine.os === 'windows' ? 'darwin-macbook-pro' : 'windows-desktop',
        migrateFrom: source,
        interactive: false,
        interaction,
        catalog,
      }),
    ).rejects.toThrow('incompatible');
    expect(await readFile(configFile, 'utf8')).toBe(before);
    const moved = await saveBinding(system, {
      source: other,
      host: otherHost,
      migrateFrom: source,
      interactive: false,
      interaction,
      catalog,
    });
    expect(await readFile(moved.previousConfigBackup as string, 'utf8')).toBe(
      before,
    );
    expect((await readBinding(system)).source).toBe(other);
    await saveBinding(system, {
      source,
      host,
      migrateFrom: other,
      interactive: false,
      interaction,
      catalog,
    });
    await mkdir(join(other, 'apps/cli/bin'), { recursive: true });
    await mkdir(join(other, 'apps/cli/dist'), { recursive: true });
    await cp(
      join(root, 'apps/cli/bin/chc.mjs'),
      join(other, 'apps/cli/bin/chc.mjs'),
    );
    await cp(
      join(root, 'apps/cli/dist/index.js'),
      join(other, 'apps/cli/dist/index.js'),
    );
    const path = join(other, 'apps/cli/bin/chc.mjs');
    const executionEnv = {
      ...env(home),
      PATH: `${resolve(binary as string, '..')}:${process.env.PATH}`,
    };
    const result = await exec(
      node,
      [path, 'dotfiles', 'env', 'setup', '--dry-run', '--json'],
      { cwd: other, env: executionEnv },
    );
    expect(JSON.parse(result.stdout).result.source).toBe(source);
    const { rename } = await import('node:fs/promises');
    await rename(source, `${source}-away`);
    try {
      await expect(
        exec(node, [path, 'dotfiles', 'env', 'setup', '--dry-run', '--json'], {
          cwd: other,
          env: executionEnv,
        }),
      ).rejects.toThrow();
    } finally {
      await rename(`${source}-away`, source);
    }
  },
);
rendererTest(
  'native adoption validates all paths and backup/Git policy before source mutation',
  async () => {
    const { home, source, system, interaction, configFile } = await renderer();
    const { catalog } = await loadSnapshot(source);
    await saveBinding(system, {
      source,
      host,
      interactive: false,
      interaction,
      catalog,
    });
    await expect(adoptFiles(system, source, host, [], true)).rejects.toThrow(
      'Usage',
    );
    const file = join(home, '.example');
    await writeFile(file, 'local');
    for (const excluded of [
      '.gitconfig',
      '.ssh/config',
      '.ssh/id_ed25519',
      '.cthutool/credentials/notion.json',
    ])
      await expect(
        adoptFiles(system, source, host, [file, join(home, excluded)], true),
      ).rejects.toThrow('Sensitive');
    await expect(
      readFile(join(source, 'dotfiles/home/dot_example')),
    ).rejects.toThrow();
    await expect(
      adoptFiles(system, source, host, [file, join(home, '.missing')], true),
    ).rejects.toThrow('does not exist');
    const state = join(home, '.cthutool/state');
    const { rename } = await import('node:fs/promises');
    await rename(state, `${state}-preserved`);
    await writeFile(state, 'not a directory');
    await expect(
      adoptFiles(system, source, host, [file], true),
    ).rejects.toThrow();
    expect(await readFile(file, 'utf8')).toBe('local');
    await expect(
      readFile(join(source, 'dotfiles/home/dot_example')),
    ).rejects.toThrow();
    await rm(state);
    await rename(`${state}-preserved`, state);
    await writeFile(
      configFile,
      `${await readFile(configFile, 'utf8')}\n[git]\nautoCommit = true\n`,
    );
    await expect(
      adoptFiles(system, source, host, [file], true),
    ).rejects.toThrow('git.autoCommit');
    await expect(
      readFile(join(source, 'dotfiles/home/dot_example')),
    ).rejects.toThrow();
  },
);

rendererTest(
  'missing host, cancelled selection and candidate-save failure preserve original configuration',
  async () => {
    const { source, system, interaction, configFile } = await renderer();
    const { catalog } = await loadSnapshot(source);
    await expect(
      saveBinding(system, { source, interactive: false, interaction, catalog }),
    ).rejects.toThrow('Missing host');
    await expect(
      saveBinding(system, {
        source,
        interactive: true,
        interaction: { ...interaction, selectHost: async () => undefined },
        catalog,
      }),
    ).rejects.toThrow('Missing host');
    await saveBinding(system, {
      source,
      host,
      interactive: false,
      interaction,
      catalog,
    });
    const before = await readFile(configFile, 'utf8');
    const original = system.run;
    system.run = async (command, args, options) =>
      args.includes('--config')
        ? { code: 1, stdout: '', stderr: 'Injected candidate error' }
        : original(command, args, options);
    await expect(
      saveBinding(system, {
        source,
        host: otherHost,
        interactive: false,
        interaction,
        catalog,
      }),
    ).rejects.toThrow('did not validate');
    expect(await readFile(configFile, 'utf8')).toBe(before);
  },
);

rendererTest(
  'real npm bootstrap launcher retains its Node/prefix, SSH origin and fixed binding across source use and update check',
  async () => {
    const { home } = await renderer();
    const { chmod, stat } = await import('node:fs/promises');
    const primary = join(home, 'Documents/GitHub/CthuTool');
    const alternate = join(home, 'alternate');
    const remote = join(home, 'remote.git');
    const bin = join(home, 'testbin');
    await mkdir(bin);
    await mkdir(primary, { recursive: true });
    for (const f of ['package.json', '.chezmoiroot', '.chezmoiversion'])
      await cp(join(root, f), join(primary, f));
    await cp(join(root, 'dotfiles'), join(primary, 'dotfiles'), {
      recursive: true,
    });
    await mkdir(join(primary, 'apps/cli/bin'), { recursive: true });
    await mkdir(join(primary, 'apps/cli/dist'), { recursive: true });
    await mkdir(join(primary, 'scripts'));
    await cp(
      join(root, 'apps/cli/bin/chc.mjs'),
      join(primary, 'apps/cli/bin/chc.mjs'),
    );
    await cp(
      join(root, 'apps/cli/dist/index.js'),
      join(primary, 'apps/cli/dist/index.js'),
    );
    await cp(
      join(root, 'scripts/install-chc.sh'),
      join(primary, 'scripts/install-chc.sh'),
    );
    const actualGit = execFileSync('which', ['git'], {
      encoding: 'utf8',
    }).trim();
    const isolated = {
      ...env(home),
      GIT_CONFIG_GLOBAL: join(home, 'gitconfig'),
      GIT_CONFIG_NOSYSTEM: '1',
      MISE_SKIP_RESHIM: '1',
      npm_config_offline: 'true',
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      npm_config_update_notifier: 'false',
    };
    async function git(args: string[]) {
      return exec(actualGit, ['-C', primary, ...args], { env: isolated });
    }
    await git(['init', '-b', 'main']);
    await git(['add', '.']);
    await git([
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'fixture',
    ]);
    await exec(actualGit, ['clone', '--bare', primary, remote], {
      env: isolated,
    });
    await git([
      'remote',
      'add',
      'origin',
      'git@github.com:mickmetalholic/CthuTool.git',
    ]);
    await git(['worktree', 'add', '-b', 'fixture-switch', alternate]);
    const head = (await git(['rev-parse', 'HEAD'])).stdout.trim();
    await exec(
      actualGit,
      ['-C', remote, 'update-ref', 'refs/heads/fixture-switch', head],
      { env: isolated },
    );
    async function executable(name: string, text: string) {
      const path = join(bin, name);
      await writeFile(path, `#!/bin/bash\n${text}\n`);
      await chmod(path, 0o755);
    }
    await executable(
      'git',
      `command="$1"; shift; args=(); for arg in "$@"; do if { [ "$command" = fetch ] || [ "$command" = ls-remote ]; } && { [ "$arg" = git@github.com:mickmetalholic/CthuTool.git ] || [ "$arg" = origin ]; }; then args+=("$FIXTURE_REMOTE"); else args+=("$arg"); fi; done; exec "$FIXTURE_GIT" "$command" "\${args[@]}"`,
    );
    await executable(
      'ssh',
      "printf 'Hi fixture! You have successfully authenticated.\\n' >&2; exit 1",
    );
    await executable('mise', 'exit 0');
    const preload = join(home, 'notion-fixture.mjs');
    await writeFile(
      preload,
      "globalThis.fetch=async(url)=>{if(String(url).startsWith('https://api.notion.com/v1/'))return Response.json({properties:{}});throw new Error('Unexpected network');};",
    );
    const childEnv = {
      ...isolated,
      PATH: `${bin}:${resolve(binary as string, '..')}:${resolve(node, '..')}:${process.env.PATH}`,
      FIXTURE_REMOTE: remote,
      FIXTURE_GIT: actualGit,
      NODE_OPTIONS: `--import=${preload}`,
      NOTION_TOKEN: 'fake-local-bootstrap-token',
    };
    await exec(
      'bash',
      [join(root, 'scripts/bootstrap.sh'), '--no-interactive', '--host', host],
      { env: childEnv, timeout: 120000 },
    );
    const launcher = join(home, '.cthutool/bin/chc');
    const run = (args: string[]) =>
      exec(launcher, args, { env: childEnv, cwd: home, timeout: 120000 });
    const status = await run(['source', 'status', '--json']);
    expect(status.stdout).toContain(primary);
    expect(status.stdout).toContain(
      'git@github.com:mickmetalholic/CthuTool.git',
    );
    await run(['source', 'use', alternate, '--json', '--no-interactive']);
    const plan = JSON.parse(
      (await run(['dotfiles', 'env', 'setup', '--dry-run', '--json'])).stdout,
    );
    expect(plan.result.source).toBe(primary);
    const prefix = join(home, '.cthutool/npm');
    const linked = await realpath(join(prefix, 'lib/node_modules/cthutool'));
    expect(linked).toBe(alternate);
    const checked = await run([
      'source',
      'update',
      '--check',
      '--ref',
      'fixture-switch',
      '--json',
      '--no-interactive',
    ]);
    expect(checked.stdout).toContain(alternate);
    expect(checked.stdout).toContain(
      'git@github.com:mickmetalholic/CthuTool.git',
    );
    expect(await readFile(launcher, 'utf8')).toContain(node);
    expect((await stat(launcher)).uid).toBe(process.getuid?.() ?? 0);
    await expect(
      readFile(join(home, '.cthutool/source/CthuTool/package.json'), 'utf8'),
    ).rejects.toThrow();
  },
);

rendererTest(
  'home application retains bootstrap-selected SSH identity and local host mappings',
  async () => {
    const { home, source, system } = await renderer();
    await mkdir(join(home, '.ssh'), { recursive: true });
    const local =
      'Host github.com\n  IdentityFile ~/.ssh/id_ed25519_cthutool\nHost local-host\n  HostName fixture.invalid\n';
    await writeFile(join(home, '.ssh/config'), local);
    const output = await system.run('chezmoi', [
      '--source',
      source,
      '--destination',
      home,
      '--override-data',
      JSON.stringify({ local: { host } }),
      'cat',
      join(home, '.ssh/config'),
    ]);
    expect(output.code).toBe(0);
    expect(output.stdout.trimEnd()).toBe(local.trimEnd());
  },
);

// Exercise the real process adapter: native editors/prompts require all three TTY streams.
async function terminalCli(args: string[], home: string, response = 'skip\r') {
  const python = `import os,pty,sys,signal
pid,fd=pty.fork()
if pid==0: os.execvp(sys.argv[1],sys.argv[1:])
signal.signal(signal.SIGTERM, lambda *_: os.kill(pid,signal.SIGHUP))
pending=b''
while True:
 try: data=os.read(fd,4096)
 except OSError: break
 if not data: break
 sys.stdout.buffer.write(data);sys.stdout.buffer.flush()
 pending+=data
 if b'?2004h' in pending and b'overwrite/all-overwrite/skip/quit' in pending:
  os.write(fd,os.environ['FIXTURE_RESPONSE'].encode());pending=b''
_,status=os.waitpid(pid,0)
sys.exit(os.waitstatus_to_exitcode(status))
`;
  return exec(
    'python3',
    ['-c', python, node, entry, 'dotfiles', 'config', ...args],
    {
      env: {
        ...env(home),
        PATH: `${resolve(binary as string, '..')}:${process.env.PATH}`,
        FIXTURE_RESPONSE: response,
        NO_COLOR: '1',
      },
      timeout: 30000,
    },
  );
}
rendererTest(
  'configured native merge receives a real terminal and JSON never opens an editor',
  async () => {
    const { home, source, system, configFile, interaction } = await renderer();
    const { catalog } = await loadSnapshot(source);
    await saveBinding(system, {
      source,
      host,
      interactive: false,
      interaction,
      catalog,
    });
    const target = join(home, `.${shell}rc`);
    await writeFile(target, '# local');
    const record = join(home, 'merge-record.json');
    const merger = join(home, 'native merge.mjs');
    await writeFile(
      merger,
      `import fs from 'node:fs';fs.writeFileSync(${JSON.stringify(record)},JSON.stringify({tty:[process.stdin.isTTY,process.stdout.isTTY,process.stderr.isTTY],args:process.argv.slice(2)}));fs.appendFileSync(process.argv[3],'\\n# native merge kept this\\n');`,
    );
    await writeFile(
      configFile,
      `${await readFile(configFile, 'utf8')}\n[merge]\ncommand = ${JSON.stringify(node)}\nargs = [${JSON.stringify(merger)}, "{{ .Destination }}", "{{ .Source }}", "{{ .Target }}"]\n`,
    );
    const denied = await cli(
      ['dotfiles', 'config', 'add', target, '--json'],
      home,
    );
    expect(denied.code).not.toBe(0);
    expect(denied.stdout.trim().split('\n')).toHaveLength(1);
    await expect(readFile(record)).rejects.toThrow();
    await terminalCli(['add', target], home);
    const captured = JSON.parse(await readFile(record, 'utf8'));
    expect(captured.tty).toEqual([true, true, true]);
    expect(captured.args[0]).toBe(target);
    expect(captured.args[1]).toBe(
      join(source, `dotfiles/home/dot_${shell}rc.tmpl`),
    );
    expect(await readFile(target, 'utf8')).toBe('# local');
    expect(await readFile(captured.args[1], 'utf8')).toContain(
      'native merge kept this',
    );
  },
);
rendererTest(
  'interactive native apply supports skip then explicit overwrite without approval receipts',
  async () => {
    const { home, source, system, interaction } = await renderer();
    const { catalog } = await loadSnapshot(source);
    await saveBinding(system, {
      source,
      host,
      interactive: false,
      interaction,
      catalog,
    });
    const target = join(home, `.${shell}rc`);
    await writeFile(target, '# preserve local');
    const skipped = await terminalCli(['apply'], home);
    expect(skipped.stdout).toContain('already exists');
    expect(await readFile(target, 'utf8')).toBe('# preserve local');
    await terminalCli(['apply'], home, 'all-overwrite\r');
    expect(await readFile(target, 'utf8')).not.toBe('# preserve local');
    expect(await readFile(target, 'utf8')).toContain('mise activate');
    await writeFile(target, '# another local edit');
    const checked = await exec(
      node,
      [entry, 'dotfiles', 'config', 'apply', '--json'],
      {
        env: {
          ...env(home),
          PATH: `${resolve(binary as string, '..')}:${process.env.PATH}`,
        },
      },
    ).catch((e) => e);
    expect(checked.code).not.toBe(0);
    expect(checked.stdout.trim().split('\n')).toHaveLength(1);
    expect(await readFile(target, 'utf8')).toBe('# another local edit');
  },
);

rendererTest(
  'init prints environment checks, returns structured JSON and honors quiet output',
  async () => {
    const { home, source } = await renderer();
    const bin = join(home, 'fixture-bin');
    await mkdir(bin);
    const mise = join(bin, 'mise');
    await writeFile(mise, '#!/bin/sh\necho "mise fixture-version"\n');
    const { chmod } = await import('node:fs/promises');
    await chmod(mise, 0o755);
    const executionEnv = {
      ...env(home),
      PATH: `${bin}:${resolve(binary as string, '..')}:${process.env.PATH}`,
    };
    const base = [
      entry,
      'dotfiles',
      'init',
      '--source',
      source,
      '--host',
      host,
      '--no-interactive',
    ];
    const human = await exec(node, base, { env: executionEnv });
    expect(human.stdout).toContain('◆ CthuTool  dotfiles › init');
    expect(human.stdout).toContain('◇ Environment');
    expect(human.stdout).toContain('chezmoi  checking…');
    expect(human.stdout).toContain('mise  checking…');
    expect(human.stdout).toContain('mise fixture-version');
    expect(human.stdout).toContain('mise  reused');
    expect(human.stdout).toContain('◇ Host binding');
    expect(human.stdout).toContain('◇ Host profile');
    expect(human.stdout).toContain('◇ Next steps');
    expect(human.stdout).toContain('└ ✓ Host binding saved');
    expect(human.stdout).not.toContain('"environment":');
    const json = await exec(node, [...base, '--json'], { env: executionEnv });
    expect(json.stdout.trim().split('\n')).toHaveLength(1);
    const report = JSON.parse(json.stdout);
    expect(report.ok).toBe(true);
    expect(report.result.environment.node).toMatch(/^v24\./);
    expect(report.result.environment.tools).toContainEqual({
      tool: 'mise',
      path: mise,
      status: 'reused',
      version: 'mise fixture-version',
    });
    expect(json.stdout).not.toContain('[init]');
    expect(json.stderr).toBe('');
    const quiet = await exec(node, [...base, '--quiet'], { env: executionEnv });
    expect(quiet.stdout).toBe('');
    expect(quiet.stderr).toBe('');
  },
);
