import { describe, expect, test } from 'bun:test';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  abbreviateHomePath,
  actionableCliSourceCandidates,
  presentCliSourceCandidate,
  sourceChoiceLabel,
  sourcePresentationDescription,
} from '../../src/command/source-presentation';
import {
  type CliSourceCandidate,
  type CliSourceCommandResult,
  createCliSourceManagerDeps,
  discoverCliSources,
} from '../../src/domain/cli-source-manager';

const repositoryRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);

function candidate(
  overrides: Partial<CliSourceCandidate> = {},
): CliSourceCandidate {
  return {
    id: 'local',
    kind: 'main',
    mode: 'local',
    path: '/workspace/CthuTool',
    active: false,
    available: true,
    bundlePresent: true,
    ...overrides,
  };
}

function requiredManagedCandidate(
  candidates: readonly CliSourceCandidate[],
): CliSourceCandidate {
  const managed = candidates.find((item) => item.kind === 'managed');
  if (!managed) throw new Error('Expected a managed source candidate.');
  return managed;
}

async function runGit(
  cwd: string,
  args: readonly string[],
): Promise<CliSourceCommandResult> {
  const proc = Bun.spawn(['git', '-C', cwd, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'ignore',
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { code: await proc.exited, stdout, stderr };
}

describe('source candidate presentation', () => {
  test('abbreviates only paths contained by the home directory', () => {
    expect(abbreviateHomePath('/Users/example', '/Users/example')).toBe('~');
    expect(abbreviateHomePath('/Users/example/project', '/Users/example')).toBe(
      '~/project',
    );
    expect(
      abbreviateHomePath('/Users/example-other/project', '/Users/example'),
    ).toBe('/Users/example-other/project');
  });

  test('describes detached worktrees and invalid candidates consistently', () => {
    const detached = presentCliSourceCandidate(
      candidate({
        id: 'worktree:abc',
        kind: 'worktree',
        detached: true,
      }),
      '/Users/example',
    );
    expect(sourcePresentationDescription(detached)).toBe(
      'worktree · detached · ready',
    );
    expect(sourceChoiceLabel(candidate({ detached: true }), '/home/me')).toBe(
      'local — main · detached · ready',
    );

    const invalid = presentCliSourceCandidate(
      candidate({
        id: 'remote',
        kind: 'managed',
        mode: 'remote',
        available: false,
        bundlePresent: false,
      }),
      '/Users/example',
    );
    expect(invalid).toMatchObject({
      state: 'unavailable',
      actionable: false,
      hint: expect.stringContaining('Repair or move'),
    });
  });

  test('presents a missing remote once and keeps its canonical JSON path', async () => {
    const temporaryHome = await realpath(
      await mkdtemp(join(tmpdir(), 'cthutool-source-presentation-')),
    );
    try {
      const inventory = await discoverCliSources(
        createCliSourceManagerDeps({
          home: () => temporaryHome,
          cwd: () => repositoryRoot,
          runtimeRoot: () => repositoryRoot,
          runGit,
        }),
      );
      const remote = requiredManagedCandidate(inventory.candidates);
      const presentation = presentCliSourceCandidate(remote, temporaryHome);

      expect(presentation).toMatchObject({
        selector: 'remote',
        state: 'not installed',
        displayPath: '~/.cthutool/source/CthuTool',
        hint: 'Selecting remote will install and switch to it.',
        actionable: true,
      });
      expect(actionableCliSourceCandidates([remote], temporaryHome)).toEqual([
        remote,
      ]);
      expect(JSON.parse(JSON.stringify(remote))).toMatchObject({
        path: join(temporaryHome, '.cthutool', 'source', 'CthuTool'),
        available: false,
        reason: 'The managed source checkout does not exist.',
      });
    } finally {
      await rm(temporaryHome, { force: true, recursive: true });
    }
  });
});
