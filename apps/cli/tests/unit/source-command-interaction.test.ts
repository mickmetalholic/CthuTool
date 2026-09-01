import { describe, expect, test } from 'bun:test';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCommand } from 'citty';
import { createSourceCommand } from '../../src/command/source.command';
import { sourceChoiceLabel } from '../../src/command/source-presentation';
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

function requiredManagedCandidate(
  candidates: readonly CliSourceCandidate[],
): CliSourceCandidate {
  const managed = candidates.find((candidate) => candidate.kind === 'managed');
  if (!managed) throw new Error('Expected a managed source candidate.');
  return managed;
}

describe('source command interactive selection', () => {
  test('offers ready and installable candidates but excludes invalid ones', async () => {
    const temporaryHome = await realpath(
      await mkdtemp(join(tmpdir(), 'cthutool-source-command-')),
    );
    const previousExitCode = process.exitCode;
    try {
      const manager = createCliSourceManagerDeps({
        home: () => temporaryHome,
        cwd: () => repositoryRoot,
        runtimeRoot: () => repositoryRoot,
        runGit,
      });
      const discovered = await discoverCliSources(manager);
      const remote = requiredManagedCandidate(discovered.candidates);
      const readyWorktree: CliSourceCandidate = {
        id: 'worktree:ready',
        kind: 'worktree',
        mode: 'local',
        path: join(temporaryHome, 'ready'),
        active: false,
        available: true,
        bundlePresent: true,
        detached: true,
      };
      const invalidWorktree: CliSourceCandidate = {
        ...readyWorktree,
        id: 'worktree:invalid',
        path: join(temporaryHome, 'invalid'),
        available: false,
        bundlePresent: false,
        reason: 'Missing committed CLI bundle.',
      };
      let offered: readonly CliSourceCandidate[] = [];
      let selected: string | undefined;
      const command = createSourceCommand({
        manager,
        isTty: () => true,
        discoverSources: async () => ({
          ...discovered,
          candidates: [readyWorktree, remote, invalidWorktree],
        }),
        interaction: {
          async chooseSource(candidates, home) {
            offered = candidates;
            expect(sourceChoiceLabel(readyWorktree, home)).toContain(
              'worktree · detached · ready',
            );
            expect(sourceChoiceLabel(remote, home)).toContain(
              'managed · not installed',
            );
            expect(sourceChoiceLabel(remote, home)).toContain(
              'Selecting remote will install and switch to it.',
            );
            return 'remote';
          },
        },
        async switchSource(selector) {
          selected = selector;
          return {
            status: 'bootstrapped',
            previous: discovered.active,
            selected: { ...remote, active: true },
          };
        },
      });

      process.exitCode = 0;
      await runCommand(command, { rawArgs: ['use'] });

      expect(offered.map((candidate) => candidate.id)).toEqual([
        'worktree:ready',
        'remote',
      ]);
      expect(selected).toBe('remote');
      expect(process.exitCode).toBe(0);
    } finally {
      process.exitCode = previousExitCode;
      await rm(temporaryHome, { force: true, recursive: true });
    }
  });
});
