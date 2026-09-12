## Context

The prior repository contract generated OpenSpec adapters during setup and Git checkout. The current implementation in this PR uses OpenSpec 1.13.0 core Skills as checked-in outputs. `AGENTS.md` and `openspec/config.yaml` are durable policy sources; generated `SKILL.md` files are not edited for project-specific policy.

## Goals / Non-Goals

**Goals:**

- Make the six selected workflows available immediately in every clone and worktree.
- Keep a single shared output where agent discovery permits it, with a native ZCode output where required.
- Make future regeneration reviewable as an ordinary Git diff.

**Non-Goals:**

- Manage third-party Skills or Codex user-scope GitHub Skills.
- Change `codex/plugins/cthu-codex` or unrelated OpenSpec changes.
- Require each agent's CLI to be installed merely to verify that its files exist.

## Decisions

### Commit OpenSpec output as a snapshot

Generate the six core workflows with the selected OpenSpec CLI, track the resulting `.agents/skills/openspec-*` and `.zcode/skills/openspec-*` files, and review regeneration diffs before committing. This removes startup dependence on a package script or Git hook. The alternative was continuing to regenerate on every checkout; that made skill availability depend on local package installation and hook execution.

### Use shared and native discovery paths

Select OpenSpec's `codex,agents,zcode` targets in Skills delivery mode. Codex, Cursor, OpenCode, and Pi discover the shared `.agents/skills` tree; ZCode reads its native `.zcode/skills` tree. Separate generated copies for Cursor, OpenCode, and Pi would duplicate identical workflow content and increase drift.

### Keep policy outside generated Skills

Repository policy remains in `AGENTS.md`, `openspec/config.yaml`, and `docs/ai-tooling.md`. Regeneration may replace generated files, so hand-editing them would lose changes. Authored Cursor Skills remain tracked independently, and the business plugin remains protected.

### Remove the bootstrap but retain commit hooks

Remove the setup/check scripts and the post-checkout generation hook. Keep `pnpm setup:git-hooks` for ordinary commit checks. Verification reads the committed paths and OpenSpec health rather than silently repairing missing files.

## Risks / Trade-offs

- A checked-in OpenSpec snapshot can lag behind an installed CLI version. Pin the version used for the snapshot in documentation and review the generated diff during upgrades.
- Global OpenSpec delivery mode can affect other projects. Document the temporary `skills` setting and restore a previous global mode when needed.
- Discovery behavior depends on each agent's project trust and Skill support. Document each invocation form and check the actual files and available host integrations during verification.

## Migration Plan

1. Generate and commit the selected OpenSpec snapshot; update policy and documentation.
2. Remove obsolete setup/check scripts, checkout bootstrap, and their contract tests; update remaining hook and CI contracts.
3. Verify OpenSpec health, the committed skill set, Git diff cleanliness, and root validation gates.
4. To roll back, revert the commit that changes the snapshot and setup path; existing clones can continue using the previously committed files until they update.
