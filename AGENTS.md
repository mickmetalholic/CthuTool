## Agent Adapter Policy

- Keep intentionally shared, portable project instructions (for example `AGENTS.md` and authored Cursor skills such as `commit` / `create-pull-request`).
- Treat OpenSpec-generated adapters under `.agents/skills`, `.cursor/skills`, and `.opencode/skills` as reproducible outputs. Do not hand-edit them for project policy; regenerate with `pnpm setup:ai-tooling`.
- Do not commit generated `openspec-*` adapter trees; they remain ignored and are recreated by setup.
- Canonical project-authored skills live in `skills/` and are linked into agent skill trees by setup.
- See `docs/ai-tooling.md` for ownership, invocation forms, and third-party skill lifecycle.

## OpenSpec Naming

- Name `openspec/specs/<capability>` directories with a monorepo area prefix so ownership is visible from the directory name.
- Use prefixes such as `apps-cli-*`, `apps-backend-*`, `apps-desktop-*`, `apps-web-*`, or `packages-<package>-*` instead of generic names when creating or syncing main specs.

## Protected Business Plugin

- `codex/plugins/cthu-codex` is a business plugin outside project-level AI tooling standardization.
- Do not modify it when regenerating OpenSpec adapters or linking baseline skills.

## Worktree Policy

- Prefer Codex App Worktree threads for isolated Codex tasks.
- Use project-local `.worktrees/<task>` only for manual, long-lived local debugging.
- Keep each worktree scoped to one task or one OpenSpec change.
- Do not archive, sync, or commit neighboring OpenSpec changes unless explicitly requested.
- Verify the current directory and branch before running tests or committing.
