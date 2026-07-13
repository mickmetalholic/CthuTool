---
title: CLI Tool
description: Install, update, and remove the `chc` command-line tool.
---

The CLI is exposed as `chc` and runs on client computers.

## Target Prerequisites

Target machines need:

- `git`
- Node.js 24.x
- `npm`

Target machines do not need `pnpm` or `bun` for normal install/update. The installer uses the committed `apps/cli/dist/index.js` bundle and globally installs the root package that exposes `chc`.

## Install from GitHub

For personal use from GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
chc --help
```

Raw/stdin installer usage selects remote mode. It clones or updates `https://github.com/mickmetalholic/CthuTool.git` into `~/.cthutool/source/CthuTool`, checks out the selected ref, verifies the committed CLI bundle, and runs `npm install -g --ignore-scripts`.

When the user's login shell is zsh, the installer also enables persistent `chc` completion in the user's zsh profile. Set `CHC_INSTALL_COMPLETION=none` to skip completion setup.

Override source or version:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | CHC_REF=v0.1.0 bash
CHC_INSTALL_MODE=remote CHC_REF=v0.1.0 scripts/install-chc.sh
CHC_INSTALL_MODE=remote CHC_REPO_URL=https://github.com/mickmetalholic/CthuTool.git CHC_INSTALL_DIR="$HOME/.cthutool/source/CthuTool" scripts/install-chc.sh
CHC_INSTALL_COMPLETION=none scripts/install-chc.sh
```

## Install from a Local Checkout

Run the installer from a checkout when you want global `chc` to follow that checkout:

```bash
scripts/install-chc.sh
pnpm --filter @cthutool/cli dev
chc --help
```

Local file execution selects local mode by default. It installs from the checkout containing `scripts/install-chc.sh` instead of cloning or updating the managed checkout.

To restore global `chc` to the managed remote checkout:

```bash
CHC_INSTALL_MODE=remote scripts/install-chc.sh
```

`CHC_INSTALL_MODE` accepts `auto`, `local`, or `remote`. In `auto` mode, raw/stdin execution selects `remote` and local file execution selects `local`. `CHC_INSTALL_COMPLETION` accepts `auto`, `zsh`, or `none`.

## Update

```bash
chc version
chc status
chc update
chc update --ref v0.1.0
```

`chc status` detects the source checkout used by the running global command. It reports `mode: local` for a linked development checkout and `mode: remote` for the default managed checkout, together with that checkout's Git and bundle state. Pass `--install-dir <path>` to inspect a different checkout explicitly.

## Uninstall

Use the package manager that installed the global command:

```bash
npm uninstall -g cthutool
```

Command reference: [CLI Commands](/reference/cli/).

Source reference: `apps/cli/README.md`.
