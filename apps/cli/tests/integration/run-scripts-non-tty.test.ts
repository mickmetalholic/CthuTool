import { describe, expect, test } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('scripts command non-interactive', () => {
  test('prints help when the script id is omitted at the CLI entrypoint', async () => {
    const proc = Bun.spawn(['bun', 'run', 'src/index.ts', 'scripts'], {
      cwd: cliRoot,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });
    const out = await new Response(proc.stdout).text();
    const err = await new Response(proc.stderr).text();
    const code = await proc.exited;
    expect(code).toBe(0);
    expect(err).toBe('');
    expect(out).toContain('USAGE');
    expect(out).toContain('COMMANDS');
    expect(out).toContain('AVAILABLE SCRIPTS');
    expect(out).toContain('convert-to-cbz');
    expect(out).toContain('list');
    expect(out).toContain('run');
  });

  test('prints JSON error when script id is missing in JSON mode', async () => {
    const proc = Bun.spawn(
      ['bun', 'run', 'src/index.ts', 'scripts', '--json'],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const out = await new Response(proc.stdout).text();
    const err = await new Response(proc.stderr).text();
    const code = await proc.exited;
    expect(code).not.toBe(0);
    expect(JSON.parse(out)).toEqual({
      ok: false,
      error: {
        code: 'missing_required_argument',
        message:
          'script id is required in non-interactive mode (use: chc scripts run <id>, chc scripts <id>, or --script <id>)',
      },
    });
    expect(err).toBe('');
  });

  test('lists discovered scripts in human and JSON modes', async () => {
    const human = Bun.spawn(['bun', 'run', 'src/index.ts', 'scripts', 'list'], {
      cwd: cliRoot,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });
    const humanOut = await new Response(human.stdout).text();
    expect(await human.exited).toBe(0);
    expect(humanOut).toContain('AVAILABLE SCRIPTS');
    expect(humanOut).toContain('convert-to-cbz');

    const json = Bun.spawn(
      ['bun', 'run', 'src/index.ts', 'scripts', 'list', '--json'],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const jsonOut = await new Response(json.stdout).text();
    expect(await json.exited).toBe(0);
    const payload = JSON.parse(jsonOut) as {
      ok: boolean;
      command: string;
      scripts: Array<{ id: string; title: string; description?: string }>;
    };
    expect(payload.ok).toBe(true);
    expect(payload.command).toBe('scripts list');
    const listedIds = payload.scripts.map((script) => script.id).sort();
    expect(payload.scripts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'convert-to-cbz' }),
      ]),
    );

    const help = Bun.spawn(
      ['bun', 'run', 'src/index.ts', 'scripts', '--help'],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const helpOut = await new Response(help.stdout).text();
    expect(await help.exited).toBe(0);

    const completion = Bun.spawn(
      ['bun', 'run', 'src/index.ts', '__complete', 'scripts', ''],
      {
        cwd: cliRoot,
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      },
    );
    const completionIds = (await new Response(completion.stdout).text())
      .trim()
      .split(/\r?\n/)
      .filter((candidate) => candidate !== 'list' && candidate !== 'run')
      .sort();
    expect(await completion.exited).toBe(0);

    expect(completionIds).toEqual(listedIds);
    for (const script of payload.scripts) {
      expect(humanOut).toContain(script.id);
      expect(humanOut).toContain(script.title);
      expect(helpOut).toContain(script.id);
      expect(helpOut).toContain(script.title);
    }
  });
});
