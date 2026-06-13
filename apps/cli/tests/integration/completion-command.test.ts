import { describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function runCli(args: string[], env: Record<string, string> = {}) {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: { ...process.env, ...env },
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });

  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, out, err };
}

async function runProcess(
  command: string,
  args: string[],
  options: {
    readonly cwd?: string;
    readonly env?: Record<string, string>;
  } = {},
) {
  const proc = Bun.spawn([command, ...args], {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });

  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, out, err };
}

function lines(value: string): string[] {
  return value.trim().length === 0 ? [] : value.trim().split(/\r?\n/).sort();
}

describe('shell completion command', () => {
  test('prints PowerShell and zsh adapter scripts', async () => {
    const powershell = await runCli(['completion', 'powershell']);
    const zsh = await runCli(['completion', 'zsh']);

    expect(powershell.code).toBe(0);
    expect(powershell.err).toBe('');
    expect(powershell.out).toContain('Register-ArgumentCompleter');
    expect(powershell.out).toContain('chc __complete');
    expect(powershell.out).toContain('$completionText');
    expect(powershell.out).toContain('__cthutool_empty_completion_word__');

    expect(zsh.code).toBe(0);
    expect(zsh.err).toBe('');
    expect(zsh.out).toContain('#compdef chc');
    expect(zsh.out).toContain('compdef _chc_completion chc');
    expect(zsh.out).toContain('chc __complete');
  });

  test('rejects unsupported shell names clearly', async () => {
    const result = await runCli(['completion', 'fish']);

    expect(result.code).not.toBe(0);
    expect(result.out).toBe('');
    expect(result.err).toContain('unsupported shell: fish');
  });

  test('completes commands, flags, and bundled script ids', async () => {
    await expect(runCli(['__complete', ''])).resolves.toMatchObject({
      code: 0,
      err: '',
      out: expect.any(String),
    });

    expect(lines((await runCli(['__complete', ''])).out)).toEqual([
      'codex',
      'completion',
      'scripts',
    ]);
    expect(lines((await runCli(['__complete', 'co'])).out)).toEqual([
      'codex',
      'completion',
    ]);
    expect(lines((await runCli(['__complete', 'codex', ''])).out)).toEqual([
      'apply',
      'export',
      'install',
      'status',
    ]);
    expect(
      lines(
        (
          await runCli([
            '__complete',
            'codex',
            '__cthutool_empty_completion_word__',
          ])
        ).out,
      ),
    ).toEqual(['apply', 'export', 'install', 'status']);
    expect(lines((await runCli(['__complete', 'codex'])).out)).toEqual([
      'codex',
    ]);
    expect(lines((await runCli(['__complete', 'completion', ''])).out)).toEqual(
      ['disable', 'enable', 'powershell', 'status', 'zsh'],
    );
    expect(
      lines((await runCli(['__complete', 'completion', 'enable', ''])).out),
    ).toEqual(['powershell']);
    expect(
      lines((await runCli(['__complete', 'completion', 'disable', ''])).out),
    ).toEqual(['powershell']);
    expect(
      lines((await runCli(['__complete', 'completion', 'status', ''])).out),
    ).toEqual(['powershell']);
    expect(
      lines((await runCli(['__complete', 'codex', 'status', '--'])).out),
    ).toContain('--json');
    expect(
      lines((await runCli(['__complete', 'codex', 'status', '--'])).out),
    ).toContain('--repo-root');
    expect(
      lines(
        (await runCli(['__complete', 'codex', 'status', '--json', '--'])).out,
      ),
    ).not.toContain('--json');
    expect(lines((await runCli(['__complete', 'scripts', ''])).out)).toContain(
      'convert-to-cbz',
    );
    expect(
      lines((await runCli(['__complete', 'scripts', '--script', ''])).out),
    ).toContain('convert-to-cbz');
  });

  test('manages persistent PowerShell completion in an isolated profile', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'chc-completion-'));
    const profilePath = join(tempRoot, 'Microsoft.PowerShell_profile.ps1');
    const env = { CHC_COMPLETION_POWERSHELL_PROFILE: profilePath };

    try {
      const initialStatus = await runCli(
        ['completion', 'status', 'powershell'],
        env,
      );
      expect(initialStatus.code).toBe(0);
      expect(initialStatus.err).toBe('');
      expect(initialStatus.out).toContain('disabled');
      expect(initialStatus.out).toContain(profilePath);

      const enabled = await runCli(['completion', 'enable', 'powershell'], env);
      expect(enabled.code).toBe(0);
      expect(enabled.err).toBe('');
      expect(enabled.out).toContain('enabled');
      expect(enabled.out).toContain(profilePath);
      expect(enabled.out).toContain('Restart PowerShell to load it');
      expect(enabled.out).toContain(
        'chc completion powershell | Out-String | Invoke-Expression',
      );

      const content = await readFile(profilePath, 'utf8');
      expect(content).toContain('# >>> cthutool chc completion >>>');
      expect(content).toContain(
        'chc completion powershell | Out-String | Invoke-Expression',
      );
      expect(content).toContain('# <<< cthutool chc completion <<<');

      const secondEnable = await runCli(
        ['completion', 'enable', 'powershell'],
        env,
      );
      expect(secondEnable.code).toBe(0);
      expect(secondEnable.err).toBe('');
      expect(secondEnable.out).toContain('already enabled');
      expect(secondEnable.out).toContain('Restart PowerShell to load it');
      const afterSecondEnable = await readFile(profilePath, 'utf8');
      expect(afterSecondEnable.match(/cthutool chc completion/g)?.length).toBe(
        2,
      );
      const enabledStatus = await runCli(
        ['completion', 'status', 'powershell'],
        env,
      );
      expect(enabledStatus.code).toBe(0);
      expect(enabledStatus.out).toContain('enabled');
      expect(enabledStatus.out).toContain('Restart PowerShell to load it');

      await writeFile(
        profilePath,
        `Write-Host "before"\n${afterSecondEnable}Write-Host "after"\n`,
      );
      const disabled = await runCli(
        ['completion', 'disable', 'powershell'],
        env,
      );
      expect(disabled.code).toBe(0);
      expect(disabled.err).toBe('');
      expect(disabled.out).toContain('disabled');
      const afterDisable = await readFile(profilePath, 'utf8');
      expect(afterDisable).toContain('Write-Host "before"');
      expect(afterDisable).toContain('Write-Host "after"');
      expect(afterDisable).not.toContain('cthutool chc completion');

      const finalStatus = await runCli(
        ['completion', 'status', 'powershell'],
        env,
      );
      expect(finalStatus.code).toBe(0);
      expect(finalStatus.out).toContain('disabled');
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  test('rejects managed completion for unsupported shells', async () => {
    const result = await runCli(['completion', 'enable', 'zsh']);

    expect(result.code).not.toBe(0);
    expect(result.out).toBe('');
    expect(result.err).toContain(
      'managed persistent completion currently supports PowerShell only',
    );
  });

  test('migrates the legacy manual PowerShell profile line when enabling', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'chc-completion-legacy-'));
    const profilePath = join(tempRoot, 'Microsoft.PowerShell_profile.ps1');
    const env = { CHC_COMPLETION_POWERSHELL_PROFILE: profilePath };

    try {
      await writeFile(
        profilePath,
        [
          'Write-Host "before"',
          '# CthuTool CLI completion',
          'chc completion powershell | Out-String | Invoke-Expression',
          'Write-Host "after"',
          '',
        ].join('\n'),
      );

      const enabled = await runCli(['completion', 'enable', 'powershell'], env);
      expect(enabled.code).toBe(0);
      expect(enabled.err).toBe('');

      const content = await readFile(profilePath, 'utf8');
      expect(content).toContain('Write-Host "before"');
      expect(content).toContain('Write-Host "after"');
      expect(content).toContain('# >>> cthutool chc completion >>>');
      expect(content).not.toContain('# CthuTool CLI completion');
      expect(
        content.match(
          /chc completion powershell \| Out-String \| Invoke-Expression/g,
        )?.length,
      ).toBe(1);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  test('resolves PowerShell profile path in the built Node CLI', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'chc-node-completion-'));
    const bundlePath = join(tempRoot, 'chc.mjs');

    try {
      const build = await runProcess(
        'bun',
        ['build', 'src/index.ts', '--outfile', bundlePath, '--target', 'node'],
        { cwd: cliRoot },
      );
      expect(build.code).toBe(0);

      const status = await runProcess(process.execPath, [
        bundlePath,
        'completion',
        'status',
        'powershell',
      ]);

      expect(status.code).toBe(0);
      expect(status.err).toBe('');
      expect(status.out).toContain('PowerShell completion');
      expect(status.out).toContain('.ps1');
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });
});
