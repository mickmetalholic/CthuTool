# @cthutool/cli

## Global Install

From the repository root:

```bash
npm install -g .
chc codex status
```

The global command runs the built JavaScript bundle with Node. Bun is only used by this repository's build and test scripts.

Target machines only need `git`, Node.js 24.x, and `npm` for the GitHub
installer and update flow. They do not need `pnpm` or `bun` because the runtime
bundle is committed at `apps/cli/dist/index.js`.

For personal installation from the public GitHub repository, run the installer
directly:

```bash
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash
```

The public raw installer runs in remote mode. It keeps a source checkout at
`~/.cthutool/source/CthuTool`, verifies the committed CLI bundle, and installs
the root package globally so `chc` is on `PATH`.

Run the repository installer from a checkout to install global `chc` from that
checkout:

```bash
scripts/install-chc.sh
```

Local file execution runs in local mode by default. It uses the repository that
contains `scripts/install-chc.sh` instead of cloning or updating the managed
checkout.

Override defaults with environment variables:

```bash
CHC_INSTALL_MODE=remote CHC_REPO_URL=https://github.com/mickmetalholic/CthuTool.git CHC_REF=main scripts/install-chc.sh
curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | CHC_REF=v0.1.0 bash
CHC_INSTALL_MODE=remote CHC_REF=v0.1.0 scripts/install-chc.sh
CHC_INSTALL_MODE=remote CHC_INSTALL_DIR="$HOME/dev/CthuTool" scripts/install-chc.sh
```

`CHC_INSTALL_MODE` accepts `auto`, `local`, or `remote`. In `auto` mode, which
is the default, raw stdin execution selects `remote` and local file execution
selects `local`. `CHC_REPO_URL`, `CHC_REPO`, `CHC_REF`, and `CHC_INSTALL_DIR`
apply to `remote` mode.

Update an installed CLI in place:

```bash
chc version
chc status
chc update
chc update --ref v0.1.0
```

`chc self-update` remains available as a backward-compatible alias for
`chc update`.

## Local Development

For local development, install the checkout once and keep the built CLI
updated:

```bash
scripts/install-chc.sh
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

Commands that support the agent contract accept these common flags:

```bash
--json              Print one machine-readable JSON value to stdout
--no-interactive    Disable prompts even when stdin is a TTY
--quiet             Suppress non-essential human status output
```

In JSON mode, stdout is reserved for the JSON response. Human warnings and diagnostics are written to stderr.

## Shell Completion

Install or link `chc` first so the command is available on your shell `PATH`.

Load PowerShell completion in the current session:

```powershell
chc completion powershell | Out-String | Invoke-Expression
```

To load it for every PowerShell session, add the same line to your PowerShell profile.

Or let `chc` manage the PowerShell profile entry:

```powershell
chc completion enable powershell
chc completion status powershell
chc completion disable powershell
```

The managed profile entry is wrapped in `cthutool chc completion` markers so `disable` only removes the block written by `chc`.
`enable` and `status` report the managed profile entry state. Open a new PowerShell session, or run the current-session load command above, to register completion in an already-open shell.

Load zsh completion in the current session:

```zsh
source <(chc completion zsh)
```

To load it for every zsh session, add the same line to `.zshrc`.

## Bundled Scripts

Run bundled scripts through the `scripts` subcommand:

```bash
chc scripts <script-id>
```

Interactive terminals may omit the script id and choose from a prompt:

```bash
chc scripts
```

Agent and CI callers should provide the script id explicitly:

```bash
chc scripts convert-to-cbz --input ./samples --json --no-interactive
chc scripts --script convert-to-cbz --input ./samples --json
```

## convert-to-cbz

`convert-to-cbz` scans the input directory recursively, converts `.pdf` and `.epub` files, and writes `.cbz` outputs under `<input>/.output` by default.

Example:

```bash
chc scripts convert-to-cbz --input ./samples --format jpg --quality 90 --concurrency 4
```

If `--input` is omitted, the command prompts for a directory interactively.

JSON example:

```bash
chc scripts convert-to-cbz --input ./samples --json
```

If `--input` is omitted in non-interactive mode, the command exits non-zero and prints a JSON error when `--json` is set.

## Codex Config

Inspect local-versus-repository Codex configuration:

```bash
chc codex status
chc codex status --json
```

Human status output is grouped for review:

```text
Codex Status Details
local: C:\Users\you\.codex
repo:  C:\work\project\codex

Area      Added  Removed  Modified  Unchanged
prompts       +2      -0      ~1      =4
rules         +0      -0      ~0      =1

prompts
+ daily.md
~ review.md

Repository-owned assets not installed locally
skills: commit-changes
plugins: cthu-codex

Repository plugins
cthu-codex: not applied

Next
Next: run `chc codex install` to install repository-owned assets locally.
```

Back up safe local Codex configuration into the repository, restore repository Codex configuration locally, or install repository-owned Codex assets locally:

```bash
chc codex export
chc codex apply
chc codex install
```

`chc codex status` also reports repository plugin state under `codex/plugins`: `not applied` before install registers it locally, `applied` after the local marketplace points at the repository plugin, and `disabled` for disabled manifest entries. Repository skills and plugins under `codex/skills` and `codex/plugins` are reported as repository-owned assets not installed locally even when they are intentionally omitted from export-generated manifests. It also reports local backup intent that is not tracked yet, unsupported restore intent, and unsafe runtime state under repository `codex/`, such as auth files, sqlite files, caches, sessions, logs, memories, and temp directories.

Only `codex/prompts`, `codex/rules`, `codex/skills`, `codex/plugins`, `codex/skills.manifest.json`, `codex/plugins.manifest.json`, and `codex/README.md` are managed as reproducible repository config. Repository `.codex/` remains project-local agent context and is ignored by `chc codex status`, `export`, `apply`, and `install`.

`chc codex export` is the regular local-to-repository backup path. It mirrors local `~/.codex/prompts` and `~/.codex/rules` into `codex/`, records locally installed user skills/plugins in the manifests without copying their files, and never copies local skill/plugin files into repository-owned `codex/skills` or `codex/plugins`. System skills, plugin-provided skills, runtime marker directories, plugin caches, auth, sqlite databases, logs, sessions, caches, memories, and `config.toml` remain unmanaged.

Generated prompt command adapters such as OpenSpec `opsx-*.md` files are ignored during prompt comparison and export, and preserved during apply. They are regenerated by their owning tool instead of being committed as repository config.

Repository-owned skills and plugins live under `codex/skills` and `codex/plugins`; their source of truth is the repository, and they only flow from repository to local during `chc codex install`. `install` registers enabled repository plugins and synchronizes their local Codex cache entries. Repository skill and plugin directories are installed by default when no manifest entry exists yet; disabled manifest entries remain disabled. `apply` does not install repository-owned skills or plugins, so it can restore prompts, rules, and non-repository install intent without changing repository-maintained assets. External `skill:<name>` entries are restored from Codex's local official skill import cache when that source exists; otherwise unsupported external entries are reported for manual follow-up.

## Command Authoring Checklist

- Derive `CliContext` at the command boundary.
- Check `context.interactive` before calling prompt APIs.
- Make required inputs expressible as flags or positional arguments.
- Return `CliCommandError` values for expected command failures.
- In `--json` mode, write exactly one JSON value to stdout.
- Keep warnings and diagnostics on stderr.
- Add focused tests for non-interactive missing input and JSON output.
