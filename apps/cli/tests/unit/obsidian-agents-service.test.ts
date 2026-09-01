import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createObsidianAgentsDirectoryLink,
  inspectObsidianAgentsPath,
  sameCanonicalPath,
} from '../../src/domain/obsidian-agents-service';

describe('Obsidian agents filesystem inspection', () => {
  test('classifies absent paths, directories, files, links, and broken links', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-path-'));
    const absentPath = join(root, 'absent');
    const directoryPath = join(root, 'Agents');
    const filePath = join(root, 'file.txt');
    const linkPath = join(root, '.agents');
    await mkdir(directoryPath);
    await writeFile(filePath, 'file\n', 'utf8');
    await createObsidianAgentsDirectoryLink(linkPath, directoryPath);

    await expect(inspectObsidianAgentsPath(absentPath)).resolves.toMatchObject({
      kind: 'absent',
    });
    await expect(
      inspectObsidianAgentsPath(directoryPath),
    ).resolves.toMatchObject({ kind: 'directory', empty: true });
    await expect(inspectObsidianAgentsPath(filePath)).resolves.toMatchObject({
      kind: 'file',
    });
    const linkState = await inspectObsidianAgentsPath(linkPath);
    expect(linkState).toMatchObject({ kind: 'link', target: directoryPath });
    expect(linkState.resolvedTarget).toBeDefined();
    await expect(
      sameCanonicalPath(linkState.resolvedTarget ?? '', directoryPath),
    ).resolves.toBe(true);

    await rm(directoryPath, { recursive: true });
    await expect(inspectObsidianAgentsPath(linkPath)).resolves.toMatchObject({
      kind: 'broken_link',
      target: directoryPath,
    });
  });

  test('compares canonical aliases using platform path semantics', async () => {
    const root = await mkdtemp(join(tmpdir(), 'cthutool-obsidian-canonical-'));
    const targetPath = join(root, 'Agents');
    const linkPath = join(root, '.agents');
    await mkdir(targetPath);
    await createObsidianAgentsDirectoryLink(linkPath, targetPath);

    await expect(sameCanonicalPath(linkPath, targetPath)).resolves.toBe(true);
    await expect(
      sameCanonicalPath(targetPath, join(root, 'Elsewhere')),
    ).resolves.toBe(false);
  });
});
