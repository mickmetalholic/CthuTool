## Agent Adapter Policy

- Keep intentionally shared `.claude/`, `.codex/`, and `.cursor/` instructions when they are project-specific and portable.
- Do not commit generated command/skill adapters under agent-specific folders; regenerate those per tool or platform instead.

## OpenSpec Naming

- Name `openspec/specs/<capability>` directories with a monorepo area prefix so ownership is visible from the directory name.
- Use prefixes such as `apps-cli-*`, `apps-backend-*`, `apps-desktop-*`, `apps-web-*`, or `packages-<package>-*` instead of generic names when creating or syncing main specs.

## Worktree Policy

- Prefer Codex App Worktree threads for isolated Codex tasks.
- Use project-local `.worktrees/<task>` only for manual, long-lived local debugging.
- Keep each worktree scoped to one task or one OpenSpec change.
- Do not archive, sync, or commit neighboring OpenSpec changes unless explicitly requested.
- Verify the current directory and branch before running tests or committing.
