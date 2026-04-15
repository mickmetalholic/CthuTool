import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ENTRY_FILE } from '../../src/domain/script-catalog';
import type { ScriptManifest } from '../../src/domain/script-manifest-schema';
import { runBundledScript } from '../../src/flow/run-bundled-script';

async function makePackage(
  dir: string,
  manifest: ScriptManifest,
  entrySource: string,
) {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'script.json'), JSON.stringify(manifest), 'utf8');
  await writeFile(join(dir, ENTRY_FILE), entrySource, 'utf8');
}

describe('runBundledScript', () => {
  test('invokes async default export', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-run-'));
    await makePackage(
      root,
      { id: 'x-async', title: 'Async' },
      `export default async function run(): Promise<void> { console.log('async-ok'); }`,
    );
    const result = await runBundledScript({
      id: 'x-async',
      rootPath: root,
      manifest: { id: 'x-async', title: 'Async' },
      entryRelative: ENTRY_FILE,
    });
    expect(result.isOk()).toBe(true);
  });

  test('invokes sync default export', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-run-'));
    await makePackage(
      root,
      { id: 'x-sync', title: 'Sync' },
      `export default function run(): void { console.log('sync-ok'); }`,
    );
    const result = await runBundledScript({
      id: 'x-sync',
      rootPath: root,
      manifest: { id: 'x-sync', title: 'Sync' },
      entryRelative: ENTRY_FILE,
    });
    expect(result.isOk()).toBe(true);
  });

  test('fails when default export is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-run-'));
    await makePackage(
      root,
      { id: 'x-no-def', title: 'No' },
      `export const named = () => {};`,
    );
    const result = await runBundledScript({
      id: 'x-no-def',
      rootPath: root,
      manifest: { id: 'x-no-def', title: 'No' },
      entryRelative: ENTRY_FILE,
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.kind).toBe('no_default_export');
    }
  });
});
