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
| `desktop-agent-console.md` | Source notes for CthuDesktop product shell, backend agent connection, local browser host model, APIs, and packaging. |
| `browser-auth.md` | Source notes for browser auth profile ownership across backend, desktop, and CLI. |
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
- Desktop or browser implementation work: read `desktop-agent-console.md`,
  `browser-auth.md`, and the relevant OpenSpec capability specs.
- CLI implementation work: read `../apps/cli/README.md` and the `apps-cli-*`
  OpenSpec specs.
