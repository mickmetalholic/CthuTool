---
title: CLI Tool
description: Install, update, and remove the `chc` command-line tool.
---

The CLI is exposed as `chc`.

## Install from GitHub

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
chc --help
```

The installer clones or updates the repository under `~/.cthutool/source/CthuTool`, installs dependencies, builds `@cthutool/cli`, and globally installs the root package that exposes `chc`.

Override source or version:

```bash
CHC_REF=v0.1.0 scripts/install-chc.sh
CHC_REPO_URL=https://github.com/mickmetalholic/CthuTool.git CHC_INSTALL_DIR="$HOME/.cthutool/source/CthuTool" scripts/install-chc.sh
```

The global command runs the built JavaScript bundle with Node. Bun is used by repository build and test scripts, not by the installed runtime.

## Update

```bash
chc self-update
chc self-update --ref v0.1.0
```

## Local Development Install

From a checkout:

```bash
npm install -g .
chc --help
```

## Uninstall

Use the package manager that installed the global command:

```bash
npm uninstall -g cthutool
```

Command reference: [CLI Commands](/reference/cli/).

Source reference: `apps/cli/README.md`.
