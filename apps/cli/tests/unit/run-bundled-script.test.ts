import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ScriptPackage } from '../../src/domain/script-catalog';
import { runBundledScript } from '../../src/flow/run-bundled-script';
import { createCliContext } from '../../src/runtime/cli-context';
import { createCliDiagnostics } from '../../src/runtime/observability';
import type { CliOutput } from '../../src/runtime/output';

describe('runBundledScript', () => {
  test('passes parsed args and CLI context to the default export', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-script-'));
    const outputPath = join(root, 'received.json');
    await mkdir(root, { recursive: true });
    await writeFile(
      join(root, 'index.ts'),
      [
        'export default async function run(args, context) {',
        `  await Bun.write(${JSON.stringify(outputPath)}, JSON.stringify({ args, cli: context.cli }));`,
        '}',
      ].join('\n'),
      'utf8',
    );
    const pkg: ScriptPackage = {
      id: 'test-script',
      rootPath: root,
      entryRelative: 'index.ts',
      manifest: {
        id: 'test-script',
        title: 'Test Script',
        description: 'Test script',
      },
    };

    const result = await runBundledScript(
      pkg,
      { input: './samples', format: 'jpg' },
      {
        cli: {
          isTty: false,
          interactive: false,
          json: true,
          quiet: false,
        },
      },
    );

    expect(result.isOk()).toBe(true);
    expect(JSON.parse(await readFile(outputPath, 'utf8'))).toEqual({
      args: { input: './samples', format: 'jpg' },
      cli: {
        isTty: false,
        interactive: false,
        json: true,
        quiet: false,
      },
    });
  });

  test('emits redacted lifecycle diagnostics for script failures', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-script-'));
    await mkdir(root, { recursive: true });
    await writeFile(
      join(root, 'index.ts'),
      [
        'export default async function run(args, context) {',
        '  context.diagnostics.emit({',
        '    level: "warn",',
        '    event: "test.script_warning",',
        '    details: { token: args.token, inputPath: args.inputPath },',
        '  });',
        '  throw new Error("failed token=" + args.token);',
        '}',
      ].join('\n'),
      'utf8',
    );
    const pkg: ScriptPackage = {
      id: 'failing-script',
      rootPath: root,
      entryRelative: 'index.ts',
      manifest: {
        id: 'failing-script',
        title: 'Failing Script',
        description: 'Failing script',
      },
    };
    const stderr: string[] = [];
    const output: CliOutput = {
      stdout: { write: () => undefined },
      stderr: { write: (chunk) => stderr.push(chunk) },
    };
    const cli = createCliContext({ json: true }, { isTty: () => false });
    const diagnostics = createCliDiagnostics(
      cli,
      output,
      { command: 'scripts' },
      {
        isEnabled: () => true,
        now: () => new Date('2026-06-23T00:00:00.000Z'),
      },
    );

    const result = await runBundledScript(
      pkg,
      {
        inputPath: '/tmp/private/input.cbz',
        token: 'secret-value',
      },
      {
        cli,
        diagnostics,
      },
    );

    expect(result.isErr()).toBe(true);
    const events = stderr
      .join('')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(events.map((event) => event.event)).toEqual([
      'cli.script_started',
      'test.script_warning',
      'cli.script_failed',
    ]);
    expect(events[0].details.scriptArgs.argumentKeys).toEqual([
      'inputPath',
      'token',
    ]);
    expect(JSON.stringify(events)).not.toContain('secret-value');
    expect(events[1].details.token).toBe('[redacted]');
    expect(events[1].details.inputPath).toBe('private/input.cbz');
    expect(events[2].message).toBe('failed token=[redacted]');
  });
});
