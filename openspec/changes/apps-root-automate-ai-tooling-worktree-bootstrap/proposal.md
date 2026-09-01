## Why

Generated OpenSpec adapters are intentionally ignored, so a fresh Git worktree does not contain `.agents/skills`, `.cursor/skills`, or `.opencode/skills` even when the source checkout is configured correctly. Relying on each AI host's environment setup makes the repository behave differently across Codex, Cursor, OpenCode, Reasonix, and manually created worktrees.

## What Changes

- Replace the generated Husky hook indirection with a repository-tracked Git hook surface while preserving the existing pre-commit and commit-message checks.
- Install the repository hook path automatically from the package dependency-install lifecycle, with safe handling for CI and non-Git package installation contexts.
- Add an idempotent `post-checkout` workflow that detects missing or stale generated OpenSpec adapters and regenerates them after standard Git worktree creation, independently of the AI tool that requested the worktree.
- Initialize or repair the current checkout during hook installation when the documented OpenSpec prerequisite is available, and emit actionable diagnostics without corrupting a completed checkout when it is not.
- Document and contract-test the automatic bootstrap path, its prerequisites, and the explicit exceptions for suppressed install scripts or `git worktree add --no-checkout`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-root-engineering-config`: Require dependency installation to configure a tracked, shared Git hook path that remains available to newly created linked worktrees while preserving existing commit checks.
- `apps-cli-ai-tooling-standardization`: Require tool-neutral, idempotent AI tooling bootstrap for the current checkout and standard Git-created worktrees without committing generated adapter trees.

## Impact

- Affects the root package lifecycle, repository Git hook layout, AI tooling setup scripts, root contract tests, and AI tooling documentation.
- Reuses `pnpm setup:ai-tooling` and the existing global OpenSpec version/profile/delivery prerequisite; no product CLI command or public application API changes.
- Removes the runtime-generated `.husky/_` path as the active hook dispatch mechanism while retaining equivalent pre-commit and commit-message behavior.
- Does not modify `codex/plugins/cthu-codex` or commit generated OpenSpec adapter directories.
