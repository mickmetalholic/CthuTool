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
- Windows PowerShell 5.1 or PowerShell 7 when using the Windows installer

Target machines do not need `pnpm` or `bun` for normal install/update. The installer uses the committed `apps/cli/dist/index.js` bundle and globally installs the root package that exposes `chc`.

## Install from GitHub

For personal use from GitHub on macOS or Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
chc --help
```

On Windows from PowerShell:

```powershell
irm https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.ps1 | iex
chc --help
```

Raw stdin/expression installer usage selects remote mode. It clones or updates `https://github.com/mickmetalholic/CthuTool.git` into `~/.cthutool/source/CthuTool`, checks out the selected ref, verifies the committed CLI bundle, and runs `npm install -g --ignore-scripts`.

The Bash installer enables persistent zsh completion when the user's login shell is zsh. The PowerShell installer enables persistent PowerShell completion. Set `CHC_INSTALL_COMPLETION=none` to skip completion setup.

Override source or version:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | CHC_REF=v0.1.0 bash
CHC_INSTALL_MODE=remote CHC_REF=v0.1.0 scripts/install-chc.sh
CHC_INSTALL_MODE=remote CHC_REPO_URL=https://github.com/mickmetalholic/CthuTool.git CHC_INSTALL_DIR="$HOME/.cthutool/source/CthuTool" scripts/install-chc.sh
CHC_INSTALL_COMPLETION=none scripts/install-chc.sh
```

```powershell
$env:CHC_INSTALL_MODE = "remote"
$env:CHC_REF = "v0.1.0"
.\scripts\install-chc.ps1
Remove-Item Env:CHC_INSTALL_MODE, Env:CHC_REF
```

## Install from a Local Checkout

Run the installer from a checkout when you want global `chc` to follow that checkout:

```bash
scripts/install-chc.sh
pnpm --filter @cthutool/cli dev
chc --help
```

```powershell
.\scripts\install-chc.ps1
pnpm --filter @cthutool/cli dev
chc --help
```

Local file execution selects local mode by default. It installs from the checkout containing the installer instead of cloning or updating the managed checkout.

To restore global `chc` to the managed remote checkout:

```bash
CHC_INSTALL_MODE=remote scripts/install-chc.sh
```

```powershell
$env:CHC_INSTALL_MODE = "remote"
.\scripts\install-chc.ps1
Remove-Item Env:CHC_INSTALL_MODE
```

`CHC_INSTALL_MODE` accepts `auto`, `local`, or `remote`. In `auto` mode, raw stdin/expression execution selects `remote` and local file execution selects `local`. The Bash installer accepts `auto`, `zsh`, or `none` for `CHC_INSTALL_COMPLETION`. The PowerShell installer also accepts `powershell` and selects it for `auto`.

## Update

```bash
chc --version
chc status
chc update --check
chc update
chc update --ref v0.1.0
```

Use `chc --version` for the lightweight version-only check. `chc status` includes that version and detects the source checkout used by the running global command. It reports `mode: local` for a linked development checkout and `mode: remote` for the default managed checkout, together with that checkout's Git and bundle state. Pass `--install-dir <path>` to inspect a different checkout explicitly.

For the default managed source, `chc update --check` and `chc update` use the checkout's existing origin and preserve its symbolic branch, exact tag, or detached commit unless an override is supplied. Checks do not change checkout files or the global command. A clean managed update validates the target bundle before checkout, applies the exact planned commit, shows current-to-target progress, and skips global reinstallation when already current.

When status reports `mode: local`, default update and check commands do not mutate the linked development checkout or `~/.cthutool/source/CthuTool`. Update the linked repository through its normal Git workflow and refresh the committed bundle with `pnpm --filter @cthutool/cli dev`. Run either installer with `CHC_INSTALL_MODE=remote` to restore the global command to managed mode.

Use `--install-dir <path>`, `--repo <url>`, and `--ref <ref>` (or `CHC_INSTALL_DIR`, `CHC_REPO_URL`, and `CHC_REF`) to explicitly select a custom update source. A successful explicit apply relinks global `chc` to the selected directory. Dirty, diverged, or invalid-bundle targets are blocked without automatic stash, reset, clean, or rebase.

Use `--quiet` for errors-only human output, `--verbose` for bounded Git and npm details on stderr, or `--json` for one structured result. Checks only run when explicitly requested; there is no periodic or shell-startup background update checker.

## Discover Commands

```bash
chc completion
chc scripts
chc scripts list
chc scripts run convert-to-cbz --input ./samples
```

Bare command groups print their registered child operations. `chc scripts` also includes an `AVAILABLE SCRIPTS` catalog. The compatibility forms `chc scripts <id>` and `chc scripts --script <id>` remain supported; `chc scripts run <id>` is the canonical execution form. See [CLI Commands](/reference/cli/) for completion lifecycle and script examples.

## Uninstall

Use the package manager that installed the global command:

```bash
npm uninstall -g cthutool
```

Command reference: [CLI Commands](/reference/cli/).

Source reference: `apps/cli/README.md`.
