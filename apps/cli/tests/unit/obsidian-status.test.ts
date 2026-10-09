import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  displayWidth,
  formatObsidianAgentsStatus,
  quoteVaultPath,
} from '../../src/command/obsidian-status';
import {
  applyObsidianAgentsSetup,
  createObsidianAgentsSetupPlan,
  inspectObsidianAgentsStatus,
} from '../../src/domain/obsidian-agents-service';
import { createObsidianAgentsDataPaths } from '../../src/infra/obsidian-agents-paths';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'cthutool-format-'));
  roots.push(root);
  const vaultPath = join(root, '工作笔记 Long Vault Name');
  await mkdir(vaultPath);
  const paths = createObsidianAgentsDataPaths({ dataRoot: join(root, 'data') });
  await applyObsidianAgentsSetup(
    paths,
    await createObsidianAgentsSetupPlan(paths, { vaultPath }),
  );
  return { vaultPath, paths };
}
// biome-ignore lint/suspicious/noControlCharactersInRegex: strip terminal ANSI styles for comparison
const stripStyle = (line: string) => line.replace(/\x1b\[[0-9;]*m/g, '');
const unindent = (lines: string[]) =>
  lines
    .map(stripStyle)
    .map((line) => line.replace(/^ {11}/, ''))
    .join('');

describe('Obsidian status presentation', () => {
  test('measures CJK, combining marks, and emoji by display cells', () => {
    expect(displayWidth('工作笔记')).toBe(8);
    expect(displayWidth('cafe\u0301')).toBe(4);
    expect(displayWidth('👩‍💻')).toBe(2);
  });
  test('renders colored healthy sections and readable plain equivalents', async () => {
    const f = await fixture();
    const report = await inspectObsidianAgentsStatus({ paths: f.paths });
    const colored = formatObsidianAgentsStatus(report, {
      color: true,
      columns: 96,
    });
    const plain = formatObsidianAgentsStatus(report, {
      color: false,
      columns: 96,
    });
    expect(colored.join('\n')).toContain('\x1b[');
    expect(colored.map(stripStyle)).toEqual(plain);
    expect(plain.join('\n')).toContain('READY');
    expect(plain.join('\n')).toContain('Skills OK  /  State OK');
    expect(plain.join('\n')).not.toContain('Issue');
  });
  test('wraps narrow sections without losing CJK paths or repair commands', async () => {
    const f = await fixture();
    await unlink(join(f.vaultPath, '.agents'));
    const report = await inspectObsidianAgentsStatus({ paths: f.paths });
    const vault = report.vaults[0];
    if (!vault) throw new Error('Expected vault');
    for (const columns of [20, 36, 80]) {
      const lines = formatObsidianAgentsStatus(report, { columns });
      expect(lines.every((line) => displayWidth(line) <= columns)).toBe(true);
      const compact = unindent(lines);
      expect(compact).toContain(vault.vaultPath);
      expect(compact).toContain(
        `chc obsidian agents setup --vault ${quoteVaultPath(vault.vaultPath)}`,
      );
      expect(lines.join('\n')).toContain('NEEDS ATTENTION');
    }
  });
  test('conflicts show manual relocation and empty state does not show a success badge', async () => {
    const f = await fixture();
    await unlink(join(f.vaultPath, '.agents'));
    await mkdir(join(f.vaultPath, '.agents'));
    const report = await inspectObsidianAgentsStatus({ paths: f.paths });
    expect(unindent(formatObsidianAgentsStatus(report))).toContain(
      'Relocate the occupied .agents path manually',
    );
    const empty = formatObsidianAgentsStatus({
      summary: { total: 0, healthy: 0, needsAttention: 0 },
      vaults: [],
    });
    expect(empty.join('\n')).toContain('No vaults configured.');
    expect(empty.join('\n')).not.toContain('READY');
  });
  test('quotes repair arguments without interpreting shell characters', async () => {
    const path = "/tmp/space ' quote $(printf unsafe) `echo unsafe`";
    const proc = Bun.spawn(
      ['/bin/sh', '-c', `printf '%s' ${quoteVaultPath(path, 'linux')}`],
      { stdout: 'pipe' },
    );
    expect(await new Response(proc.stdout).text()).toBe(path);
    expect(await proc.exited).toBe(0);
    expect(quoteVaultPath("C:\\Notes O'Brien", 'win32')).toBe(
      "'C:\\Notes O''Brien'",
    );
  });
});
