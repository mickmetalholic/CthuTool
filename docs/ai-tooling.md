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
| `chc codex skills` | Codex user-scope GitHub skills | `codex/skills.manifest.json` lifecycle only |
| Business plugin | CthuCodex product skills/MCP | `codex/plugins/cthu-codex` — **out of scope** for this tooling |

Do not copy OpenSpec workflows into the third-party skills manifest. Do not treat manually copied third-party directories as the source of truth. Do not modify `codex/plugins/cthu-codex` as part of AI tooling setup.

## Generated-file policy

**Decision:** generated OpenSpec adapter directories remain ignored and are regenerated, not hand-edited or committed.

Committed durable inputs:

- `openspec/config.yaml` and OpenSpec specs/changes
- `AGENTS.md`, this reference, and intentionally authored Cursor skills such as `commit` / `create-pull-request`

Ignored reproducible outputs (after setup):

- `.agents/skills/openspec-*`
- `.cursor/skills/openspec-*`
- `.opencode/skills/openspec-*`

Regenerate with:

```bash
pnpm setup:ai-tooling
```

Never hand-edit generated `openspec-*` skill files for project policy. Change the durable OpenSpec inputs instead, then rerun setup.

## Setup and check

```bash
# Install/refresh OpenSpec adapters (idempotent)
pnpm setup:ai-tooling

# Read-only verification
pnpm check:ai-tooling
```

Normal root dependency installation after a clone also runs
`pnpm setup:git-hooks` through the package `prepare` lifecycle. This configures
the shared repository setting `core.hooksPath=.githooks` and verifies or repairs
the current checkout's generated OpenSpec adapters. The tracked `post-checkout`
hook applies the same check-then-repair flow to later standard branch checkouts
and `git worktree add` operations, regardless of which AI host initiated Git.

The hook runs only the dependency-free repository scripts and the documented
global OpenSpec CLI. It does not install worktree dependencies, build apps,
start services, install third-party skills, or modify
`codex/plugins/cthu-codex`. Set `CTHUTOOL_DISABLE_GIT_HOOKS=1` when repository
hooks must remain disabled; CI skips installation automatically.

Automatic setup is intentionally bypassed in these cases:

- `pnpm install --ignore-scripts` skips `prepare`, so run
  `pnpm setup:git-hooks` afterward.
- `git worktree add --no-checkout` does not complete a checkout, so finish the
  checkout and run `pnpm setup:ai-tooling` in that worktree.
- Disabled Git hooks do not run `post-checkout`; repair the affected checkout
  with `pnpm setup:ai-tooling`.

If automatic initialization reports that checkout files already exist, fix the
OpenSpec prerequisite below and rerun `pnpm setup:ai-tooling`. Git populates a
worktree before invoking `post-checkout`, so a failed hook leaves a recoverable
checkout rather than rolling back its files.

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

| Tool | OpenSpec example |
| --- | --- |
| Codex | `$openspec-propose "idea"` |
| Cursor | `/openspec-propose` or attach the skill |
| OpenCode | `/openspec-propose` or skill picker |
| Reasonix 0.53.2 | `/skill openspec-propose` |

Reasonix discovers shared skills from `.agents/skills` (and other convention roots). Prefer that shared surface; do not maintain a second manually copied OpenSpec tree for Reasonix.

**Fallback:** if a future Reasonix release stops reading `.agents/skills`, document and generate a Claude-format copy only after confirming the new discovery path. Until then, keep a single shared tree.

## Third-party skills (`npx skills`)

UI/UX Pro Max is **not** installed by default. Opt in explicitly:

```bash
npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -a codex -a cursor -a opencode
```

Use `-a '*'` only when you intentionally want every detected agent. Review the source before upgrading.

`chc codex skills` continues to manage only Codex user-scope, manifest-backed GitHub skills. It does not install or remove OpenSpec adapters.

## Reasonix project configuration

Installed Reasonix: **0.53.2**.

- Do not use legacy `reasonix.toml`.
- Prefer built-in discovery of `.agents/skills`.
- Add `.reasonix/*.json` settings only when a portable, non-personal project setting is required.
- Never commit workstation absolute paths or personal permission allow-lists.
- `.reasonix/` desktop topic/session metadata is local generated state (gitignored), not portable project config.

## Explicit Git mutation workflows

Commit and pull-request actions remain **explicit** workflows (for example Cursor `/commit` and `/create-pull-request`).

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
- Removed project skill links are absent from all generated agent skill trees
- No repository-local `ui-ux-pro-max` copies under agent skill trees
- No `reasonix.toml`
- No changes under `codex/plugins/cthu-codex` from setup
