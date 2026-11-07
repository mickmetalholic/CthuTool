import { afterEach, expect, test } from 'bun:test';
import { execFile } from 'node:child_process';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = resolve(import.meta.dir, '../../../..');
const dirs: string[] = [];
afterEach(async () => {
  for (const d of dirs.splice(0)) await rm(d, { recursive: true, force: true });
});
async function script(path: string, text: string) {
  await writeFile(path, `#!/bin/bash\n${text}\n`);
  await chmod(path, 0o755);
}
async function sandbox() {
  const home = await mkdtemp(join(tmpdir(), 'chc-bootstrap-home-'));
  dirs.push(home);
  const bin = join(home, 'fakebin');
  await mkdir(bin);
  const destination = join(home, 'Documents/GitHub/CthuTool');
  await mkdir(join(destination, 'scripts'), { recursive: true });
  await mkdir(join(destination, 'apps/cli/dist'), { recursive: true });
  await writeFile(
    join(destination, 'apps/cli/dist/index.js'),
    '// fake committed bundle',
  );
  const log = join(home, 'calls');
  await script(
    join(bin, 'node'),
    `if [ "$1" = '-p' ]; then printf '%s\\n' "$FAKE_BIN/node"; elif [ "$1" = '-e' ]; then exit 0; else printf 'chc %s\\n' "$*" >> "$CALLS"; if [[ "$*" == *'notion auth'* ]] && [ "\${AUTH_FAIL:-}" = 1 ]; then exit 7; fi; fi`,
  );
  await script(
    join(bin, 'npm'),
    `printf 'npm %s\\n' "$*" >> "$CALLS"; printf '11.0.0\\n'`,
  );
  await script(
    join(bin, 'ssh'),
    `printf 'ssh %s\\n' "$*" >> "$CALLS"; if [ "\${SSH_FAIL:-}" = 1 ]; then exit 255; fi; printf 'Hi test! You have successfully authenticated, but GitHub does not provide shell access.\\n' >&2; exit 1`,
  );
  await script(
    join(bin, 'git'),
    `printf 'git %s\\n' "$*" >> "$CALLS"; if [[ "$*" == *'rev-parse --show-toplevel'* ]]; then printf '%s\\n' "$DESTINATION"; elif [[ "$*" == *'remote get-url origin'* ]]; then printf '%s\\n' "\${ORIGIN:-git@github.com:mickmetalholic/CthuTool.git}"; fi`,
  );
  await script(
    join(bin, 'sudo'),
    `printf 'UNEXPECTED sudo\\n' >> "$CALLS"; exit 99`,
  );
  await script(
    join(destination, 'scripts/install-chc.sh'),
    `[ "$CHC_INSTALL_MODE" = local ] && [ "$CHC_INSTALL_COMPLETION" = none ] || exit 90; printf 'install prefix=%s\\n' "$npm_config_prefix" >> "$CALLS"`,
  );
  return {
    home,
    bin,
    destination,
    log,
    env: {
      ...process.env,
      HOME: home,
      PATH: `${bin}:${process.env.PATH}`,
      FAKE_BIN: bin,
      CALLS: log,
      DESTINATION: destination,
    },
  };
}
test('POSIX bootstrap uses SSH, actual default checkout, local installer and pinned launcher; retry preserves work', async () => {
  const s = await sandbox();
  await exec(
    'bash',
    [
      join(root, 'scripts/bootstrap.sh'),
      '--no-interactive',
      '--host',
      'darwin-macbook-pro',
    ],
    { env: s.env },
  );
  const log = await readFile(s.log, 'utf8');
  expect(log).toContain(
    'git ls-remote git@github.com:mickmetalholic/CthuTool.git HEAD',
  );
  expect(log).toContain('notion auth');
  expect(log).toContain('dotfiles init');
  expect(log).not.toMatch(/git (clone|reset|pull|fetch)/);
  expect(log).not.toContain('UNEXPECTED');
  const launcher = await readFile(join(s.home, '.cthutool/bin/chc'), 'utf8');
  expect(launcher).toContain(`${s.bin}/node`);
  expect(launcher).toContain('npm_config_prefix');
  await exec(
    'bash',
    [
      join(root, 'scripts/bootstrap.sh'),
      '--no-interactive',
      '--host',
      'darwin-macbook-pro',
    ],
    { env: s.env },
  );
  expect(
    (await readFile(join(s.home, '.zshrc'), 'utf8')).match(
      /# >>> cthutool bootstrap PATH >>>/g,
    ),
  ).toHaveLength(1);
});
test('noninteractive SSH failure and explicit HTTPS conversion policy', async () => {
  const s = await sandbox();
  await expect(
    exec(
      'bash',
      [
        join(root, 'scripts/bootstrap.sh'),
        '--no-interactive',
        '--host',
        'host',
      ],
      { env: { ...s.env, SSH_FAIL: '1' } },
    ),
  ).rejects.toThrow();
  expect(await readFile(s.log, 'utf8')).not.toContain('install prefix');
  await expect(
    exec(
      'bash',
      [
        join(root, 'scripts/bootstrap.sh'),
        '--no-interactive',
        '--host',
        'host',
      ],
      {
        env: {
          ...s.env,
          ORIGIN: 'https://github.com/mickmetalholic/CthuTool.git',
        },
      },
    ),
  ).rejects.toThrow();
  expect(await readFile(s.log, 'utf8')).not.toContain('set-url');
  await exec(
    'bash',
    [
      join(root, 'scripts/bootstrap.sh'),
      '--no-interactive',
      '--host',
      'host',
      '--configure-ssh-remote',
    ],
    {
      env: {
        ...s.env,
        ORIGIN: 'https://github.com/mickmetalholic/CthuTool.git',
      },
    },
  );
  expect(await readFile(s.log, 'utf8')).toContain(
    'remote set-url origin git@github.com:mickmetalholic/CthuTool.git',
  );
});
test('auth failure preserves installed launcher and does not run init', async () => {
  const s = await sandbox();
  await expect(
    exec(
      'bash',
      [
        join(root, 'scripts/bootstrap.sh'),
        '--no-interactive',
        '--host',
        'host',
      ],
      { env: { ...s.env, AUTH_FAIL: '1' } },
    ),
  ).rejects.toThrow();
  expect(await readFile(join(s.home, '.cthutool/bin/chc'), 'utf8')).toContain(
    'CthuTool bootstrap launcher',
  );
  expect(await readFile(s.log, 'utf8')).not.toContain('dotfiles init');
});

test('interactive SSH onboarding generates safely, passes agent/passphrase prompts and reuses the same key', async () => {
  if (!Bun.which('python3')) return;
  const s = await sandbox();
  const ready = join(s.home, 'ssh-ready');
  const key = join(s.home, '.ssh/id_ed25519_cthutool');
  await script(
    join(s.bin, 'ssh'),
    `if [ -f "$SSH_READY_FILE" ]; then printf 'Hi! You have successfully authenticated.\\n' >&2; exit 1; fi; exit 255`,
  );
  await script(
    join(s.bin, 'ssh-agent'),
    `printf 'SSH_AUTH_SOCK=/fake-agent; export SSH_AUTH_SOCK;\\n'`,
  );
  await script(
    join(s.bin, 'ssh-add'),
    `printf 'Passphrase for selected key: ' >&2; read -r phrase; [ "$phrase" = test-passphrase ] || exit 20; printf 'ssh-add invoked\\n' >> "$CALLS"`,
  );
  await script(
    join(s.bin, 'ssh-keygen'),
    `while [ "$#" -gt 0 ]; do if [ "$1" = -f ]; then output="$2"; shift 2; else shift; fi; done; [ ! -e "$output" ] || exit 99; printf PRIVATE_MATERIAL > "$output"; chmod 600 "$output"; printf 'ssh-ed25519 PUBLIC_FIXTURE\\n' > "$output.pub"; printf 'key-generated\\n' >> "$CALLS"`,
  );
  const harness = `import os,pty,select,sys,time\npid,fd=pty.fork()\nif pid==0: os.execvpe('bash',['bash',sys.argv[1],'--host','darwin-macbook-pro'],os.environ)\noutput=b''; answered=set(); end=time.time()+20\nwhile time.time()<end:\n if not select.select([fd],[],[],0.2)[0]: continue\n try: chunk=os.read(fd,65536)\n except OSError: break\n if not chunk: break\n output+=chunk\n for prompt,answer in [(b'Key number:',sys.argv[2].encode()+b'\\n'),(b'Passphrase for selected key:',b'test-passphrase\\n'),(b'Press Enter after registration',b'\\n')]:\n  if prompt in output and prompt not in answered:\n   if prompt==b'Press Enter after registration': open(os.environ['SSH_READY_FILE'],'w').write('registered')\n   os.write(fd,answer); answered.add(prompt)\nelse:\n os.kill(pid,9)\n_,status=os.waitpid(pid,0)\nprint(output.decode(errors='replace'))\nsys.exit(os.waitstatus_to_exitcode(status))`;
  const environment = { ...s.env, SSH_READY_FILE: ready, SSH_AUTH_SOCK: '' };
  const first = await exec(
    'python3',
    ['-c', harness, join(root, 'scripts/bootstrap.sh'), '0'],
    { env: environment },
  );
  expect(first.stdout).toContain('PUBLIC_FIXTURE');
  expect(first.stdout).not.toContain('PRIVATE_MATERIAL');
  expect(await readFile(key, 'utf8')).toBe('PRIVATE_MATERIAL');
  await rm(ready);
  await exec(
    'python3',
    ['-c', harness, join(root, 'scripts/bootstrap.sh'), '1'],
    { env: environment },
  );
  expect((await readFile(s.log, 'utf8')).match(/key-generated/g)).toHaveLength(
    1,
  );
  expect(
    (await readFile(join(s.home, '.ssh/config'), 'utf8')).match(
      /IdentityFile/g,
    ),
  ).toHaveLength(1);
});

test('fresh user runtime uses a checksummed complete Node/npm archive, resumes locally and ignores another Node on PATH', async () => {
  const s = await sandbox();
  const { cp } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const target = `${process.platform}-${process.arch === 'arm64' ? 'arm64' : 'x64'}`;
  const version = '24.14.1';
  const staging = join(s.home, 'staging');
  const folder = `node-v${version}-${target}`;
  await mkdir(join(staging, folder, 'bin'), { recursive: true });
  await mkdir(join(staging, folder, 'lib/node_modules/npm/bin'), {
    recursive: true,
  });
  const original = await readFile(join(s.bin, 'node'), 'utf8');
  await script(
    join(staging, folder, 'bin/node'),
    `printf 'runtime-node prefix=%s\\n' "$npm_config_prefix" >> "$CALLS"\n${original.replace(/^#!.*\n/, '')}`,
  );
  await cp(join(s.bin, 'npm'), join(staging, folder, 'bin/npm'));
  await writeFile(
    join(staging, folder, 'lib/node_modules/npm/bin/npm-cli.js'),
    '// fixture npm CLI',
  );
  const archive = join(s.home, 'node.tgz');
  await exec('tar', ['-czf', archive, folder], { cwd: staging });
  const hash = createHash('sha256')
    .update(await readFile(archive))
    .digest('hex');
  const standalone = join(s.home, 'bootstrap.sh');
  await cp(join(root, 'scripts/bootstrap.sh'), standalone);
  const table = join(s.home, 'bootstrap-node-runtime.tsv');
  const row = `${version}\t${target}\thttps://nodejs.org/dist/v${version}/${folder}.tar.gz\t${hash}\n`;
  await writeFile(table, row);
  await script(join(s.bin, 'node'), 'exit 1');
  await script(
    join(s.bin, 'curl'),
    `while [ "$#" -gt 0 ]; do if [ "$1" = -o ]; then output="$2"; shift 2; else shift; fi; done; cp "$RUNTIME_ARCHIVE" "$output"; printf runtime-download\\n >> "$CALLS"`,
  );
  const environment = { ...s.env, RUNTIME_ARCHIVE: archive };
  await exec('bash', [standalone, '--no-interactive', '--host', 'host'], {
    env: environment,
  });
  const launcher = join(s.home, '.cthutool/bin/chc');
  const content = await readFile(launcher, 'utf8');
  expect(content).toContain(`runtime/node/${version}/${target}/bin/node`);
  await exec(launcher, ['source', 'status', '--no-interactive'], {
    env: environment,
  });
  await exec('bash', [standalone, '--no-interactive', '--host', 'host'], {
    env: environment,
  });
  expect(
    (await readFile(s.log, 'utf8')).match(/runtime-download/g),
  ).toHaveLength(1);
  expect(await readFile(s.log, 'utf8')).toContain(
    `runtime-node prefix=${join(s.home, '.cthutool/npm')}`,
  );
  const runtime = join(s.home, '.cthutool/runtime');
  await rm(runtime, { recursive: true });
  await writeFile(table, row.replace(hash, '0'.repeat(64)));
  await expect(
    exec('bash', [standalone, '--no-interactive', '--host', 'host'], {
      env: environment,
    }),
  ).rejects.toThrow('checksum mismatch');
});

test('missing Git/OpenSSH are prepared by system-only prerequisite commands while all user files retain current ownership', async () => {
  const s = await sandbox();
  const { cp, symlink, stat } = await import('node:fs/promises');
  const savedGit = join(s.home, 'saved-git');
  const savedSsh = join(s.home, 'saved-ssh');
  await cp(join(s.bin, 'git'), savedGit);
  await cp(join(s.bin, 'ssh'), savedSsh);
  await rm(join(s.bin, 'git'));
  await rm(join(s.bin, 'ssh'));
  for (const name of [
    'id',
    'head',
    'grep',
    'mkdir',
    'dirname',
    'chmod',
    'cp',
    'mv',
    'rm',
    'tar',
    'shasum',
    'sha256sum',
    'curl',
    'bash',
  ]) {
    const target = Bun.which(name);
    if (target && !Bun.which(name, { PATH: s.bin }))
      await symlink(target, join(s.bin, name));
  }
  await script(
    join(s.bin, 'uname'),
    `if [ "$1" = -s ]; then printf Linux; else printf x86_64; fi`,
  );
  await script(
    join(s.bin, 'sudo'),
    `printf 'sudo %s\\n' "$*" >> "$CALLS"; exec "$@"`,
  );
  await script(
    join(s.bin, 'apt-get'),
    `if [ "$1" = install ]; then cp "$SAVED_GIT" "$FAKE_BIN/git"; cp "$SAVED_SSH" "$FAKE_BIN/ssh"; fi`,
  );
  await exec(
    'bash',
    [join(root, 'scripts/bootstrap.sh'), '--no-interactive', '--host', 'host'],
    {
      env: { ...s.env, PATH: s.bin, SAVED_GIT: savedGit, SAVED_SSH: savedSsh },
    },
  );
  const log = await readFile(s.log, 'utf8');
  expect(log).toContain('sudo apt-get install');
  expect(
    log
      .split('\n')
      .filter((l) => l.startsWith('sudo '))
      .every((l) => l.startsWith('sudo apt-get ')),
  ).toBe(true);
  expect((await stat(join(s.home, '.cthutool/bin/chc'))).uid).toBe(
    process.getuid?.() ?? 0,
  );
});
