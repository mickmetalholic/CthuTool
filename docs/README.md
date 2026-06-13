# CthuTool Docs

This directory contains cross-package product and runtime documentation. Keep
package-specific usage in the nearest package `README.md`, and keep normative
requirements in OpenSpec under `openspec/specs/`.

## Map

| Document | Purpose |
| --- | --- |
| `../README.md` | Repository entry point: prerequisites, install, common commands, workspace layout, and documentation routing. |
| `desktop-agent-console.md` | CthuDesktop product shell, backend agent connection, local browser host model, development, APIs, and packaging notes. |
| `browser-auth.md` | Browser auth profile ownership across backend, desktop, and CLI. |
| `assets/cthutool-logo.png` | Repository logo used by the root README. |

## Related Docs

- `../apps/cli/README.md` documents the `chc` global command, shell completion,
  bundled scripts, and Codex config workflows.
- `../apps/backend/README.md` documents backend startup and simple health
  checks.
- `../codex/plugins/cthu-codex/README.md` documents the repository-managed
  CthuCodex plugin.
- `../openspec/specs/` contains the current capability requirements.

## Reading Routes

- New contributor: start with `../README.md`, then read the package README for
  the area you are changing.
- Desktop or browser work: read `desktop-agent-console.md`,
  `browser-auth.md`, and the relevant OpenSpec capability specs.
- CLI and Codex config work: read `../apps/cli/README.md` and the
  `apps-cli-*` OpenSpec specs.
