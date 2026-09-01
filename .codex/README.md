# Repository Codex Config Notes

This directory holds low-risk, portable Codex-facing notes for the repository.

## What belongs here

- `README.md` (this file)
- Intentionally shared, portable Codex instructions when they are not generated adapters

Generated OpenSpec workflow skills for Codex live under the shared surface:

```text
.agents/skills/openspec-*
```

Regenerate them with:

```bash
pnpm setup:ai-tooling
```

Do not hand-edit generated `openspec-*` skills. Do not recreate a parallel OpenSpec tree under `.codex/skills`.

## Related ownership

| Path | Role |
| --- | --- |
| `../docs/ai-tooling.md` | Full AI tooling ownership and invocation reference |
| `../codex/skills.manifest.json` | `chc codex skills` user-scope GitHub skill lifecycle |
| `../codex/plugins/cthu-codex` | Business plugin (protected; out of AI tooling setup scope) |

## Explicit Git workflows

Commit and pull-request actions remain explicit workflows.

## Local runtime state (do not commit)

Keep personal Codex runtime state outside the repository (or untracked), for example:

- `auth.json`
- session databases / caches / logs
- personal `config.toml`

Use `chc codex skills --json` for a read-only snapshot of the Codex
user-scope skill manifest before committing intentionally tracked Codex config
changes under `codex/`.
