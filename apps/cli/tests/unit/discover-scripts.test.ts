import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getBundledScriptsRoot } from '../../src/infra/bundled-scripts-root';
import { discoverScripts } from '../../src/infra/discover-scripts';

async function writePackage(
  root: string,
  dirName: string,
  manifest: { id: string; title: string; description?: string },
  entry = 'export default async function run(): Promise<void> {}',
) {
  const pkg = join(root, dirName);
  await mkdir(pkg, { recursive: true });
  await writeFile(join(pkg, 'script.json'), JSON.stringify(manifest), 'utf8');
  await writeFile(join(pkg, 'index.ts'), entry, 'utf8');
}

describe('discoverScripts', () => {
  test('collects valid packages and skips invalid ones with warnings', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-discover-'));
    await writePackage(root, 'ok-one', { id: 'ok-one', title: 'One' });
    await writePackage(root, 'ok-two', { id: 'ok-two', title: 'Two' });
    const bad = join(root, 'bad-json');
    await mkdir(bad, { recursive: true });
    await writeFile(join(bad, 'script.json'), '{', 'utf8');
    await writeFile(join(bad, 'index.ts'), 'export default () => {}', 'utf8');
    const mismatch = join(root, 'wrong-id');
    await mkdir(mismatch, { recursive: true });
    await writeFile(
      join(mismatch, 'script.json'),
      JSON.stringify({ id: 'not-wrong-id', title: 'x' }),
      'utf8',
    );
    await writeFile(
      join(mismatch, 'index.ts'),
      'export default () => {}',
      'utf8',
    );

    const result = await discoverScripts(root);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    const ids = result.value.packages.map((p) => p.id).sort();
    expect(ids).toEqual(['ok-one', 'ok-two']);
    expect(result.value.warnings.length).toBeGreaterThanOrEqual(2);
  });

  test('resolves bundled scripts root path for repo layout', () => {
    const root = getBundledScriptsRoot();
    expect(root.replaceAll('\\', '/')).toContain('/apps/cli/src/scripts');
  });

  test('prefers a packaged JavaScript entry when both runtime and source entries exist', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-packaged-script-'));
    await writePackage(root, 'packaged-script', {
      id: 'packaged-script',
      title: 'Packaged',
    });
    await writeFile(
      join(root, 'packaged-script', 'index.js'),
      'export default () => {}',
      'utf8',
    );

    const result = await discoverScripts(root);

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    expect(result.value.packages[0]?.entryRelative).toBe('index.js');
  });

  test('returns a bounded discovery error when the scripts root is unavailable', async () => {
    const root = join(
      tmpdir(),
      `cthutool-missing-scripts-${crypto.randomUUID()}`,
    );
    const result = await discoverScripts(root);

    expect(result.isErr()).toBe(true);
    if (!result.isErr()) return;
    expect(result.error.message).toContain(
      `cannot read bundled scripts directory (${root})`,
    );
  });

  test('skips script ids reserved for group operations', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-reserved-script-'));
    await writePackage(root, 'list', { id: 'list', title: 'Reserved list' });
    await writePackage(root, 'run', { id: 'run', title: 'Reserved run' });
    await writePackage(root, 'valid-script', {
      id: 'valid-script',
      title: 'Valid',
    });

    const result = await discoverScripts(root);
    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    expect(result.value.packages.map((pkg) => pkg.id)).toEqual([
      'valid-script',
    ]);
    expect(result.value.warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('script id "list" is reserved'),
        expect.stringContaining('script id "run" is reserved'),
      ]),
    );
  });
});
