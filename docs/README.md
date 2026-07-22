# CthuTool Docs

This directory contains legacy cross-package source notes and shared assets.
The primary user-facing documentation lives in `../apps/docs/`.

Keep package-local development commands in the nearest package `README.md`, and
keep normative requirements in OpenSpec under `openspec/specs/`.

The browsable documentation site lives in `../apps/docs/` and provides the
user-facing deployment, installation, module usage, operations, architecture,
and reference reading paths.

## Map

| Document | Purpose |
| --- | --- |
| `../README.md` | Repository entry point: prerequisites, common commands, workspace layout, and documentation routing. |
| `../apps/docs/` | Astro Starlight documentation site for users, operators, architecture readers, and OpenSpec browsing. |
| `agent-migration.md` | Safe migration from legacy CthuDesktop data into environment-scoped Agent storage. |
| `agent-deployment-security.md` | Personal-use public-deployment and static Agent-secret boundary. |
| `agent-release.md` | Signed UI-free Agent bundle, publication, and rollback contract. |
| `agent-local-network-access.md` | Browser local-network permission and one-time bridge launch troubleshooting. |
| `browser-auth.md` | Source notes for browser auth profile ownership across backend, Agent, and CLI. |
| `assets/cthutool-logo.png` | Repository logo used by the root README. |

## Related Docs

- `../apps/cli/README.md` documents package-local CLI development and command
  reference details.
- `../apps/backend/README.md` documents backend package startup and simple
  health checks.
- `../codex/plugins/cthu-codex/README.md` documents the repository-managed
  CthuCodex plugin.
- `../openspec/specs/` contains the current capability requirements.

## Reading Routes

- User or operator: start with `../apps/docs/`.
- New contributor: start with `../README.md`, then read the package README for
  the area you are changing.
- Agent or browser implementation work: read `agent-migration.md`,
  `agent-deployment-security.md`, `browser-auth.md`, and the relevant OpenSpec
  capability specs.
- CLI implementation work: read `../apps/cli/README.md` and the `apps-cli-*`
  OpenSpec specs.
