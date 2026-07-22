# @cthutool/cli

Package-local development reference for the `chc` command-line tool.

User-facing install, update, uninstall, command, completion, bundled-script, and
Codex config documentation lives in the docs site:

- `apps/docs/src/content/docs/client/cli.md`
- `apps/docs/src/content/docs/reference/cli.md`
- `apps/docs/src/content/docs/modules/cli.md`

## Installation Contract

Target machines only need `git`, Node.js 24.x, and `npm` for the GitHub
installer and update flow. Windows installation additionally uses Windows
PowerShell 5.1 or PowerShell 7. Targets do not need `pnpm` or `bun` because the
runtime bundle is committed at `apps/cli/dist/index.js`.

For personal installation from the public GitHub repository, run the native
installer for the target shell.

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
```

```powershell
irm https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.ps1 | iex
```

Public raw installer execution runs in remote mode. It keeps a source checkout
at `~/.cthutool/source/CthuTool`, verifies the committed CLI bundle, and
installs the root package globally so `chc` is on `PATH`.

Run the repository installer from a checkout to install global `chc` from that
checkout:

```bash
scripts/install-chc.sh
```

```powershell
.\scripts\install-chc.ps1
```

Local file execution runs in local mode by default. It uses the repository that
contains the installer instead of cloning or updating the managed checkout.

Override defaults with environment variables:

```bash
CHC_INSTALL_MODE=remote CHC_REPO_URL=https://github.com/mickmetalholic/CthuTool.git CHC_REF=main scripts/install-chc.sh
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | CHC_REF=v0.1.0 bash
CHC_INSTALL_MODE=remote CHC_REF=v0.1.0 scripts/install-chc.sh
CHC_INSTALL_MODE=remote CHC_INSTALL_DIR="$HOME/dev/CthuTool" scripts/install-chc.sh
```

```powershell
$env:CHC_INSTALL_MODE = "remote"
$env:CHC_REF = "v0.1.0"
.\scripts\install-chc.ps1
Remove-Item Env:CHC_INSTALL_MODE, Env:CHC_REF
```

`CHC_INSTALL_MODE` accepts `auto`, `local`, or `remote`. In `auto` mode, which
is the default, raw/expression execution selects `remote` and local file
execution selects `local`. `CHC_REPO_URL`, `CHC_REPO`, `CHC_REF`, and
`CHC_INSTALL_DIR` apply to `remote` mode.

Update an installed CLI in place:

```bash
chc --version
chc status
chc update --check
chc update
chc update --ref v0.1.0
```

Use `chc --version` for the lightweight version-only check. `chc status`
includes that version, automatically detects whether the running command is
linked to a local checkout or the default remote managed checkout, and reports
that source as `mode: local` or `mode: remote`. Use `--install-dir` only to
inspect a different checkout explicitly.

`chc update --check` resolves the selected remote ref and reports
`install_required`, `update_available`, or `up_to_date` without changing
checkout files or the global installation. For the default managed source, the
repository and ref default to the checkout's existing origin and symbolic
branch, exact tag, or detached commit. A normal clean update proceeds directly,
shows TTY-aware phase progress and a bounded commit summary, validates the
target bundle before checkout, and skips checkout plus `npm install -g` when
already current.

For `mode: local`, default update and check commands stop with development
guidance and do not touch either the linked checkout or the default managed
checkout. Update the linked repository with its normal Git workflow and refresh
the committed bundle with `pnpm --filter @cthutool/cli dev`. Run either
installer with `CHC_INSTALL_MODE=remote` to switch back to managed mode.
`--install-dir`, `--repo`, and `--ref` (or their environment equivalents) remain
advanced explicit source overrides; a successful update relinks global `chc` to
the selected install directory.

The updater refuses dirty, diverged, or invalid-bundle targets and never
automatically stashes, resets, cleans, or rebases local work. Use output modes
as needed:

```bash
chc update --quiet
chc update --verbose
chc update --json
chc update --check --json
```

`--verbose` writes bounded Git and npm diagnostics to stderr. JSON mode keeps
one result value on stdout with stable status, commit identities, phases, and
bounded change or failure metadata. Update checks only run when requested; the
CLI does not install a periodic or shell-startup background checker.

## Shell Completion

The installer enables persistent zsh completion automatically when the user's
login shell is zsh. The PowerShell installer enables persistent PowerShell
completion automatically. Skip automatic setup by setting
`CHC_INSTALL_COMPLETION=none` before running either installer.

Manage completion explicitly when needed:

```bash
chc completion
chc completion enable zsh
chc completion status zsh
chc completion disable zsh
source <(chc completion zsh)
```

```powershell
chc completion enable powershell
chc completion status powershell
chc completion disable powershell
chc completion powershell | Out-String | Invoke-Expression
```

The global or locally linked `chc` command must be available before loading
either completion adapter. Bare `chc completion` prints the registered
`powershell`, `zsh`, `enable`, `disable`, and `status` child commands without
changing a shell profile.

## Bundled Scripts

Use the discoverable catalog and canonical `run` operation:

```bash
chc scripts
chc scripts list
chc scripts list --json
chc scripts run convert-to-cbz --input ./samples
```

Bare `chc scripts` prints group help plus an `AVAILABLE SCRIPTS` catalog.
`chc scripts list` prints that same catalog, and `--json` returns bounded
metadata for automation. The earlier forms remain supported as shorthand and
route through the same runner:

```bash
chc scripts convert-to-cbz --input ./samples
chc scripts --script convert-to-cbz --input ./samples
```

## Local Development

For local development, install the checkout once and keep the built CLI
updated:

```bash
scripts/install-chc.sh
pnpm --filter @cthutool/cli dev
```

```powershell
.\scripts\install-chc.ps1
pnpm --filter @cthutool/cli dev
```

Then run commands through the global executable:

```bash
chc codex status
```

The `dev` script watches the TypeScript source and rebuilds
`apps/cli/dist/index.js`. The installed `chc` command runs that built
JavaScript with Node, matching the production runtime while still picking up
local changes after each rebuild.

To restore the global command to the managed checkout after local development:

```bash
CHC_INSTALL_MODE=remote scripts/install-chc.sh
```

```powershell
$env:CHC_INSTALL_MODE = "remote"
.\scripts\install-chc.ps1
Remove-Item Env:CHC_INSTALL_MODE
```

For release changes to CLI source, refresh and commit the runtime bundle in the
same change. The root pre-commit hook automatically runs this refresh and
stages `apps/cli/dist/index.js` when staged CLI bundle inputs change, but the
commands remain useful for explicit verification:

```bash
pnpm --filter @cthutool/cli build
pnpm run check:cli-dist
```

## Shared CLI Contract

For global installation, the installed `chc` command runs the committed
`apps/cli/dist/index.js` JavaScript bundle with Node.

Run focused CLI tests and type checks from the repository root:

```bash
pnpm --filter @cthutool/cli test
pnpm --filter @cthutool/cli typecheck
```

## Command Authoring Checklist

- Derive `CliContext` at the command boundary.
- Check `context.interactive` before calling prompt APIs.
- Make required inputs expressible as flags or positional arguments.
- Return `CliCommandError` values for expected command failures.
- In `--json` mode, write exactly one JSON value to stdout.
- Keep warnings and diagnostics on stderr.
- Add focused tests for non-interactive missing input and JSON output.
