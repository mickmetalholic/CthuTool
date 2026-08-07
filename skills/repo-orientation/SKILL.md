---
name: repo-orientation
description: Read-only orientation for CthuTool source boundaries, OpenSpec layout, worktree policy, and excluded business-plugin scope. Use when starting an unfamiliar task or locating where a change belongs.
---

Orient to this repository before proposing or editing code.

**Mutation boundary:** read-only. Do not create, edit, delete, commit, or push files.

## Steps

1. Confirm the current working directory and git branch.
2. Read `AGENTS.md` and `docs/ai-tooling.md` for adapter policy and ownership.
3. Summarize the durable vs generated boundary:
   - Durable: `openspec/`, `skills/`, `AGENTS.md`, intentionally authored Cursor skills
   - Generated (do not hand-edit): `.agents/skills/openspec-*`, `.cursor/skills/openspec-*`, `.opencode/skills/openspec-*`
4. Map ownership:
   - OpenSpec workflows → regenerate with `pnpm setup:ai-tooling`
   - Third-party skills → `npx skills`
   - Baseline project skills → `skills/`
   - Codex user-scope GitHub skills → `chc codex skills` / `codex/skills.manifest.json`
   - Business plugin → `codex/plugins/cthu-codex` (out of scope for tooling standardization)
5. Note OpenSpec layout: `openspec/specs/`, `openspec/changes/`, `openspec/config.yaml`.
6. Note worktree policy from `AGENTS.md`: prefer isolated Codex worktrees; keep one change per worktree; do not archive or sync neighboring changes unless asked.
7. Recommend the next workflow (OpenSpec explore/propose, baseline verify/review, or an explicit commit/PR skill) without starting implementation unless the user already asked for it.
