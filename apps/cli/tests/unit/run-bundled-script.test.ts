import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ScriptPackage } from '../../src/domain/script-catalog';
import { runBundledScript } from '../../src/flow/run-bundled-script';

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
});
