---
title: CLI Architecture
description: Architecture boundary for the `chc` command-line tool.
---

`chc` is distributed through the repository root package and runs the built JavaScript bundle with Node.

## Command Boundary

Commands derive `CliContext` at the boundary, reserve stdout for JSON in `--json` mode, and write diagnostics to stderr.

## Install and Update

The GitHub installer keeps a source checkout, builds `@cthutool/cli`, and installs the root package globally. `chc update` updates that checkout and reinstall path.

## Requirements Sources

- CLI agent contract: `openspec/specs/apps-cli-agent-contract/spec.md`
- Bundled script execution: `openspec/specs/apps-cli-bundled-script-execution/spec.md`
- Shell completion: `openspec/specs/apps-cli-shell-completion/spec.md`
- Codex config: `openspec/specs/apps-cli-codex-config/spec.md`
- Plugin management: `openspec/specs/apps-cli-codex-plugin-management/spec.md`
