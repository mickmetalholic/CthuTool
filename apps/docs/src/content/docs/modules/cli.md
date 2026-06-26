---
title: CLI
description: User and operator overview for the `chc` CLI.
---

The CLI exposes the `chc` command for client-side workflows.

## What It Does

- installs globally from the repository package
- updates itself through `chc update`
- manages shell completion
- runs bundled scripts such as `convert-to-cbz`
- manages repository-owned Codex config assets
- follows a shared JSON and non-interactive command contract

## Runtime Location

Client computer.

## Setup

Install from [CLI Tool](/client/cli/).

The installer uses the committed `apps/cli/dist/index.js` bundle for target-machine installs. Raw/stdin installer usage selects remote mode; local checkout script execution selects local mode.

## Authoritative Sources

- Development and command details: `apps/cli/README.md`
- CLI requirements: `openspec/specs/apps-cli-agent-contract/spec.md`, `openspec/specs/apps-cli-bundled-script-execution/spec.md`, `openspec/specs/apps-cli-codex-config/spec.md`, `openspec/specs/apps-cli-codex-plugin-management/spec.md`, `openspec/specs/apps-cli-distribution-ci/spec.md`, `openspec/specs/apps-cli-observability/spec.md`, `openspec/specs/apps-cli-self-installation/spec.md`, `openspec/specs/apps-cli-shell-completion/spec.md`
