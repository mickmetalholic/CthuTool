# AI Tooling Reference

Canonical ownership, setup, and invocation model for Codex, Cursor, OpenCode, and Reasonix in this repository.

## Selected toolchain

| Item | Value |
| --- | --- |
| OpenSpec CLI | `@fission-ai/openspec@1.8.0` (install globally, then regenerate) |
| OpenSpec profile | `core` |
| Core workflows | `explore`, `propose`, `apply`, `update`, `sync`, `archive` |
| Target tools | `agents`, `codex`, `cursor`, `opencode` |
| Shared OpenSpec surface | `.agents/skills` (Codex + Reasonix) |
| Native Cursor surface | `.cursor/skills` |
| Native OpenCode surface | `.opencode/skills` |

Generated skill folder names for the core set:

- `openspec-explore`
- `openspec-propose`
- `openspec-apply-change`
- `openspec-update-change`
- `openspec-sync-specs`
- `openspec-archive-change`

## Ownership boundary

| Owner | What it manages | Canonical source / command |
| --- | --- | --- |
| OpenSpec | Workflow skills (`openspec-*`) | `openspec/` + `openspec init` / `openspec update` via `pnpm setup:ai-tooling` |
| `npx skills` | Third-party reusable skills | Explicit package + `--skill` selector (not committed as copies) |
| Project-authored skills | Baseline repo skills | `skills/<name>/SKILL.md` linked by `pnpm setup:ai-tooling` |
| `chc codex skills` | Codex user-scope GitHub skills | `codex/skills.manifest.json` lifecycle only |
| Business plugin | CthuCodex product skills/MCP | `codex/plugins/cthu-codex` — **out of scope** for this tooling |

Do not copy OpenSpec workflows into the third-party skills manifest. Do not treat manually copied third-party directories as the source of truth. Do not modify `codex/plugins/cthu-codex` as part of AI tooling setup.

## Generated-file policy

**Decision:** generated OpenSpec adapter directories remain ignored and are regenerated, not hand-edited or committed.

Committed durable inputs:

- `openspec/config.yaml` and OpenSpec specs/changes
- `skills/` (project-authored baseline skills)
- `AGENTS.md`, this reference, and intentionally authored Cursor skills such as `commit` / `create-pull-request`

Ignored reproducible outputs (after setup):

- `.agents/skills/openspec-*`
- `.cursor/skills/openspec-*`
- `.opencode/skills/openspec-*`
- Linked copies of baseline skills under those agent skill trees

Regenerate with:

```bash
pnpm setup:ai-tooling
```

Never hand-edit generated `openspec-*` skill files for project policy. Change `openspec/config.yaml` or `skills/` instead, then rerun setup.

## Canonical project skills

Source tree: `skills/`

| Skill | Purpose | Mutation boundary |
| --- | --- | --- |
| `repo-orientation` | Read-only map of source boundaries, OpenSpec layout, worktrees, and excluded plugin scope | Read-only |
| `project-verify` | Select targeted validation for changed files; respects protected-service rules | May run targeted checks after confirmation; never starts protected local services or unrequested builds |
| `review-diff` | Inspect current diff, generated-file drift, and scope | Read-only; never commit/push/PR |

Setup links (default) or copies (`--copy`) these into `.agents/skills`, `.cursor/skills`, and `.opencode/skills`.

## Setup and check

```bash
# Install/refresh OpenSpec adapters + link baseline skills (idempotent)
pnpm setup:ai-tooling

# Copy instead of symlink when symlinks are inconvenient
pnpm setup:ai-tooling -- --copy

# Read-only verification
pnpm check:ai-tooling
```

A second setup run must not create duplicate skill entries or touch `codex/plugins/cthu-codex`.

Prerequisite:

```bash
npm install -g @fission-ai/openspec@1.8.0
openspec config profile core
openspec config set delivery skills
```

`pnpm setup:ai-tooling` and `pnpm check:ai-tooling` validate these global
profile/delivery settings; setup will stop before writing adapters if they
drift.

## Tool invocation forms

Do not present one tool's syntax as universal.

| Tool | OpenSpec example | Baseline skill example |
| --- | --- | --- |
| Codex | `$openspec-propose "idea"` | `$repo-orientation` |
| Cursor | `/openspec-propose` or attach the skill | `/repo-orientation` or attach the skill |
| OpenCode | `/openspec-propose` or skill picker | skill picker / `/repo-orientation` |
| Reasonix 0.53.2 | `/skill openspec-propose` | `/skill repo-orientation` |

Reasonix discovers shared skills from `.agents/skills` (and other convention roots). Prefer that shared surface; do not maintain a second manually copied OpenSpec tree for Reasonix.

**Fallback:** if a future Reasonix release stops reading `.agents/skills`, document and generate a Claude-format copy only after confirming the new discovery path. Until then, keep a single shared tree.

## Third-party skills (`npx skills`)

UI/UX Pro Max is **not** part of the default baseline. Opt in explicitly:

```bash
npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -a codex -a cursor -a opencode
```

Use `-a '*'` only when you intentionally want every detected agent. Review the source before upgrading.

`chc codex skills` continues to manage only Codex user-scope, manifest-backed GitHub skills. It does not install or remove OpenSpec adapters or `skills/` baseline entries.

## Reasonix project configuration

Installed Reasonix: **0.53.2**.

- Do not use legacy `reasonix.toml`.
- Prefer built-in discovery of `.agents/skills`.
- Add `.reasonix/*.json` settings only when a portable, non-personal project setting is required.
- Never commit workstation absolute paths or personal permission allow-lists.
- `.reasonix/` desktop topic/session metadata is local generated state (gitignored), not portable project config.

## Explicit Git mutation workflows

Commit and pull-request actions remain **explicit** workflows (for example Cursor `/commit` and `/create-pull-request`).

`repo-orientation`, `project-verify`, and `review-diff` must not commit, push, or open a pull request on their own.

## Verification checklist

```bash
openspec status --change apps-cli-ai-tooling-standardization --json
openspec validate --all
openspec doctor --json
pnpm check:ai-tooling
pnpm setup:ai-tooling && pnpm setup:ai-tooling   # idempotence
git diff --check
```

Confirm:

- Core `openspec-*` workflows exist under `.agents`, `.cursor`, and `.opencode`
- Baseline skills `repo-orientation`, `project-verify`, `review-diff` are discoverable
- No repository-local `ui-ux-pro-max` copies under agent skill trees
- No `reasonix.toml`
- No changes under `codex/plugins/cthu-codex` from setup
