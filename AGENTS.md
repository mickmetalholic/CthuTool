## Agent Adapter Policy

- Keep intentionally shared, portable project instructions (for example `AGENTS.md` and authored Cursor skills such as `commit` / `create-pull-request`).
- Keep OpenSpec-generated `openspec-*` skills under `.agents/skills` and `.zcode/skills` in Git so new checkouts can use them directly. Regenerate them with the OpenSpec CLI when upgrading; do not hand-edit generated workflows for project policy.
- Codex, Cursor, OpenCode, and Pi read the shared `.agents/skills` tree. ZCode uses its generated `.zcode/skills` tree.
- Git hooks handle commit checks only. After `pnpm install --ignore-scripts`, run `pnpm setup:git-hooks` if hooks are wanted; no Skill bootstrap is required.
- See `docs/ai-tooling.md` for ownership, invocation forms, and third-party skill lifecycle.

## OpenSpec Naming

- Name `openspec/specs/<capability>` directories with a monorepo area prefix so ownership is visible from the directory name.
- Use prefixes such as `apps-cli-*`, `apps-backend-*`, `apps-desktop-*`, `apps-web-*`, or `packages-<package>-*` instead of generic names when creating or syncing main specs.

## Protected Business Plugin

- `codex/plugins/cthu-codex` is a business plugin outside project-level AI tooling standardization.
- Do not modify it when regenerating OpenSpec adapters.

## Worktree Policy

- Prefer Codex App Worktree threads for isolated Codex tasks.
- Use project-local `.worktrees/<task>` only for manual, long-lived local debugging.
- Keep each worktree scoped to one task or one OpenSpec change.
- Do not archive, sync, or commit neighboring OpenSpec changes unless explicitly requested.
- Verify the current directory and branch before running tests or committing.
