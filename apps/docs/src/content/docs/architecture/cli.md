---
title: CLI Architecture
description: Architecture boundary for the `chc` command-line tool.
---

`chc` is distributed through the repository root package and runs the built JavaScript bundle with Node.

## Command Boundary

Commands derive `CliContext` at the boundary, reserve stdout for JSON in `--json` mode, and write diagnostics to stderr.

## Install and Update

The GitHub installer keeps a source checkout, verifies the committed CLI bundle, and installs the root package globally. `chc update --check` inspects the selected target without changing checkout files or the global command. `chc update` safely updates that checkout and reinstalls only when its commit changes.

## Requirements Sources

- CLI agent contract: `openspec/specs/apps-cli-agent-contract/spec.md`
- Bundled script execution: `openspec/specs/apps-cli-bundled-script-execution/spec.md`
- Shell completion: `openspec/specs/apps-cli-shell-completion/spec.md`
- Codex config: `openspec/specs/apps-cli-codex-config/spec.md`
- Plugin management: `openspec/specs/apps-cli-codex-plugin-management/spec.md`
