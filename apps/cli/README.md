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

## Local Agent Lifecycle

`chc agent` installs and controls the tray-owned local Agent. This is separate
from `chc update`: the latter updates this CLI checkout, while
`chc agent update` verifies and activates an Agent runtime release.

```bash
chc agent install
chc agent env list
chc agent env set production
printf '%s\n' "$AGENT_SECRET" | chc agent env set-secret production --secret-stdin
chc agent autostart enable
chc agent start
chc agent settings
chc agent status --json
chc agent logs --follow
chc agent stop
```

`settings` starts the tray when necessary and asks it to create a fresh,
one-time local bridge launch before opening the deployed Web `/agent` page.
The CLI never prints or stores the launch ticket. `env set-secret` deliberately
has no plaintext secret argument; it accepts exactly one of `--secret-stdin`
or `--secret-file`. On Unix, a secret file must have no group/other access.

Installation and updates are fail-closed. Production Agent bundles, the
environment catalog, and stable/beta channel pointers are signature- and
digest-verified. A release build must embed the Ed25519 public key through
`AGENT_RELEASE_PUBLIC_KEY_PEM` while building the committed CLI bundle. Without
that pinned key, `agent install` and `agent update` fail before downloading.

Default `chc agent uninstall` stops the tray, removes managed autostart and
binaries, and preserves environment selection, secrets, browser profiles, and
logs. `--purge` removes those categories too and requires an interactive
confirmation or `--yes` for non-interactive use.

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

### Convert PDF and EPUB to CBZ

`convert-to-cbz` recursively finds `.pdf` and `.epub` files, preserves their
relative directories, and writes `.cbz` files under `<input>/.output` unless
`--output` selects another root:

```bash
chc scripts run convert-to-cbz --input ./comics
chc scripts run convert-to-cbz --input ./comics --output ./converted --json
chc scripts run convert-to-cbz --input ./comics --overwrite
```

Existing targets are skipped by default. `--overwrite` opts into validated
replacement: the command writes a sibling partial archive, checks its page
entries and image signatures, and replaces the target only after validation.
Summaries distinguish `convertedCount`, `skippedCount`, and `failureCount`
while retaining `totalFiles` and `successCount`.

Fixed-layout EPUB pages are copied in OPF spine order from XHTML `img` and SVG
`image` references (`href` and `xlink:href`). JPEG, PNG, and WebP bytes are
preserved; text-only or malformed EPUBs fail instead of producing placeholder
pages.

PDF conversion requires Poppler commands `pdfinfo`, `pdfimages`, and
`pdftoppm`. Full-page JPEG scans are extracted without re-rendering, lossless
single-image pages are emitted as PNG, and composed or uncertain pages are
rendered at the requested `--dpi` and `--format`. Poppler can be installed with
`winget install oschwartz10612.Poppler` on Windows, `brew install poppler` on
macOS, or the distribution's `poppler-utils` package on Linux.

MOBI files, PDFs nested in ZIP/RAR archives, loose image directories,
deduplication, metadata lookup, and library-specific naming are preprocessing
or organization concerns outside this command.

## Codex Skills and Plugins

`chc codex` has two operations:

```bash
chc codex skills
chc codex install
```

`chc codex skills` opens an interactive manager for third-party GitHub skills.
Its inventory combines entries from `codex/skills.manifest.json` with locally
installed skills whose pinned-backend metadata provides a supported GitHub
repository and selector. Use Space to select state-valid actions, review the
explicit plan, and confirm before anything changes.

A GitHub skill that exists only locally appears as `local_only`; Track records
its reviewed repository, selector, and branch or pinned ref in the version 2
manifest without reinstalling the skill or copying its directory. Use Add
skills from GitHub for a skill that is not installed locally. Self-authored,
manually copied, well-known, plugin-provided, system, non-GitHub, and
provenance-incomplete local skills remain ignored. `--json` emits the same
eligible inventory without writing, and a non-interactive bare invocation fails
instead of choosing actions automatically.

Skill discovery and local operations use the pinned
`npx --yes skills@1.5.19` backend at Codex user scope. Updates are offered only
for branch-tracked entries; pinned refs remain fixed until the manifest changes.

`chc codex install` is plugin-only. It installs enabled repository plugins from
`codex/plugins.manifest.json` (and discovered repository plugin directories),
registers them in the personal marketplace, enables them in Codex, normalizes
plugin metadata, and synchronizes the personal plugin cache. It does not read or
install skills and does not synchronize prompts or rules.

### Obsidian Skill and state synchronization

Use the interactive setup once on each machine that has the Obsidian vault:

```bash
chc obsidian agents setup
```

Setup creates a visible `<vault>/Agent/` source containing `skills/` and
`state/`, then creates `<vault>/.agents` as a machine-local compatibility link
to it. Windows uses a directory junction; macOS and Linux use a directory
symlink. The source path is configurable during setup and the machine-specific
choice is stored under the local CthuTool `chc` data directory.

Obsidian Sync synchronizes the visible `Agent/` contents between machines. Run
setup once on every machine so its local `.agents` link is created. The link is
not shared, and no Git repository, Codex Hook, or explicit push/pull command is
required. Obsidian Sync is eventually consistent, so wait for it to finish
before using a Skill that was just changed on another machine.

Inspect the configured paths, link target, `skills/`, `state/`, and any leftover
legacy Git metadata without changing the vault:

```bash
chc obsidian agents status
chc obsidian agents status --json
```

If both `Agent/` and a real `.agents/` directory already contain files, setup
stops without merging or deleting either tree. Reconcile them manually, then
run setup again. An existing real `.agents/` directory is otherwise adopted as
the visible source, preserving any legacy `.git` metadata for manual cleanup.

## OpenCode Shared Assets

```bash
chc opencode skills
chc opencode mcp
```

These commands use the same repository plugin sources as `chc codex install`.
`chc opencode skills` adds enabled plugin skill directories to OpenCode's
`skills.paths`; `chc opencode mcp` translates each plugin `.mcp.json` into
OpenCode's `mcp` configuration. Existing unrelated OpenCode configuration is
preserved, and these commands do not create an OpenCode plugin or `install`
command.

The default target is `~/.config/opencode/opencode.json` (or an existing
`opencode.jsonc`). Use `--open-code-config`, `--open-code-home`, or
`--plugins-root` to override the target and source paths.

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
chc codex skills
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
