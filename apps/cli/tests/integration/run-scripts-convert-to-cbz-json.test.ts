import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const activeProcesses = new Set<ReturnType<typeof Bun.spawn>>();

type CliRunResult = {
  readonly code: number;
  readonly err: string;
  readonly out: string;
};

afterEach(() => {
  for (const proc of activeProcesses) {
    try {
      proc.kill();
    } catch {
      // Best-effort cleanup for already-exited subprocesses.
    }
  }
  activeProcesses.clear();
});

async function runCli(
  args: readonly string[],
  options: {
    readonly env?: Record<string, string | undefined>;
    readonly timeoutMs?: number;
  } = {},
): Promise<CliRunResult> {
  const proc = Bun.spawn(['bun', 'run', 'src/index.ts', ...args], {
    cwd: cliRoot,
    env: options.env,
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });
  activeProcesses.add(proc);

  const timeoutMs = options.timeoutMs ?? 15_000;
  let timeout: Timer | undefined;
  try {
    const timedOut = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        proc.kill();
        reject(new Error(`CLI subprocess timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    const [out, err, code] = await Promise.race([
      Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]),
      timedOut,
    ]);
    return { code, err, out };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
    activeProcesses.delete(proc);
  }
}

describe('scripts convert-to-cbz JSON mode', () => {
  test('runs without prompting and prints a JSON summary when input is provided', async () => {
    const inputRoot = await mkdtemp(join(tmpdir(), 'cthutool-empty-input-'));
    await mkdir(inputRoot, { recursive: true });

    const { code, err, out } = await runCli([
      'scripts',
      'convert-to-cbz',
      '--input',
      inputRoot,
      '--json',
    ]);
    const parsed = JSON.parse(out);

    expect(code).toBe(0);
    expect(err).toBe('');
    expect(parsed.ok).toBe(true);
    expect(parsed.command).toBe('scripts');
    expect(parsed.script).toBe('convert-to-cbz');
    expect(parsed.summary.totalFiles).toBe(0);
    expect(parsed.summary.outputRoot).toBe(join(inputRoot, '.output'));
  });

  test('keeps JSON stdout parseable when diagnostics are enabled', async () => {
    const inputRoot = await mkdtemp(join(tmpdir(), 'cthutool-empty-input-'));
    await mkdir(inputRoot, { recursive: true });

    const { code, err, out } = await runCli(
      ['scripts', 'convert-to-cbz', '--input', inputRoot, '--json'],
      {
        env: { ...Bun.env, CHC_CLI_DIAGNOSTICS: '1' },
      },
    );
    const parsed = JSON.parse(out);
    const diagnostics = err
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    expect(code).toBe(0);
    expect(parsed.ok).toBe(true);
    expect(parsed.script).toBe('convert-to-cbz');
    expect(diagnostics.map((event) => event.event)).toContain(
      'cli.script_started',
    );
    expect(diagnostics.map((event) => event.event)).toContain(
      'cli.command_completed',
    );
    expect(err).not.toContain(inputRoot);
  });

  test('fails without prompting when input is missing non-interactively', async () => {
    const { code, err, out } = await runCli([
      'scripts',
      'convert-to-cbz',
      '--json',
    ]);

    expect(code).not.toBe(0);
    expect(JSON.parse(out)).toEqual({
      ok: false,
      error: {
        code: 'missing_required_argument',
        message:
          'input is required in non-interactive mode (use: --input <dir>)',
      },
    });
    expect(err).toBe('');
  });
});
