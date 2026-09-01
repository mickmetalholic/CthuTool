---
title: CLI Commands
description: Current command reference entry points for `chc`.
---

Install `chc` from [CLI Tool](/client/cli/) before using these commands.

## Global

```bash
chc --help
chc --version
chc status
chc update --check
chc update
chc update --ref v0.1.0
```

Use `chc --version` for the lightweight version-only check. `chc status` includes that version, reports the detected `local` or `remote` installation mode, and presents source and installation details in a grouped, TTY-aware summary. Local mode includes the checked-out commit's absolute committer time and bounded subject. In `--json` mode these are optional `commitTime` and `commitMessage` fields. `chc status --install-dir <path>` overrides automatic source detection.

## Update

```bash
chc update --check
chc update
chc update --quiet
chc update --verbose
chc update --json
chc update --check --json
```

`--check` reports `install_required`, `update_available`, or `up_to_date`
without cloning, changing checkout files, or invoking global installation. A
clean managed update runs directly without a second confirmation. It shows the
current and target commits, at most five commit highlights, and an omitted
count when more changes exist. If both commits are equal, checkout, bundle
installation verification, and `npm install -g` are skipped.

Dirty or diverged checkouts fail before checkout mutation or global install;
the updater does not stash, reset, clean, or rebase user work. `--quiet`
suppresses nonessential human progress, `--verbose` adds bounded subprocess
details to stderr, and `--json` writes one structured status value to stdout.
The CLI performs no periodic or shell-startup update checks.

## Shared Flags

Commands that support the agent contract accept common flags:

```bash
--json              Print one machine-readable JSON value to stdout
--no-interactive    Disable prompts even when stdin is a TTY
--quiet             Suppress non-essential human status output
```

In JSON mode, stdout is reserved for the JSON response. Human warnings and diagnostics are written to stderr.

## Local Agent

Bare `chc agent` shows the statically registered command tree:

```bash
chc agent install
chc agent update
chc agent start
chc agent stop
chc agent restart
chc agent status [--json]
chc agent settings
chc agent logs [--lines 200] [--follow]
chc agent doctor [--json]
chc agent uninstall [--purge --yes]
```

Autostart operations are a nested public group:

```bash
chc agent autostart enable|disable|status
```

`chc agent install` and `chc agent update` resolve the single unsigned self-use
latest release from `agent-latest/manifest.json`. There is no `--channel` or
remote `--version` selector; local rollback restores a previous installed
version. The release protects HTTPS transport and SHA-256 integrity only and is
not an authenticated public distribution channel. OS Gatekeeper/SmartScreen
warnings may appear because platform signing is intentionally not used.

Self-use uses one fixed environment derived from the exact HTTPS Origin saved
by native Agent Settings. There is no release catalog or `agent env` selection
flow. The Agent sends the fixed `self-use` environment id over the private
network and does not use a static Agent Secret. Cloudflare protects external
Web or operator Backend HTTP access, not the private Agent WebSocket path.

`settings` auto-starts the tray and opens the native first-run/settings window.
`logs` reads the Agent-owned redacted JSON-lines source. `--follow` is a human
streaming mode and cannot be combined with `--json`.

`doctor` includes the legacy CthuDesktop migration state. Ambiguous legacy data
requires choosing the single Origin in native Agent Settings; an active profile
lock requires stopping the tray/Agent before retry. The report may provide an
exact next command but never includes legacy credentials or bridge tickets.

`chc agent uninstall` preserves the Origin, browser profiles, and logs.
`--purge` additionally removes those categories and requires an
interactive confirmation, or `--yes` when prompts are disabled. The command
never removes data when purge confirmation is absent.

`chc update` and `chc agent update` are intentionally unrelated: the first
updates the CLI source/install, while the second stages the latest self-use
Agent release, checks readiness, and automatically restores the prior active
version when the new version cannot start.

## Shell Completion

Run `chc completion` to show the registered `powershell`, `zsh`, `enable`,
`disable`, and `status` operations without changing a profile.

```powershell
chc completion powershell
chc completion enable powershell
chc completion status powershell
chc completion disable powershell
```

```zsh
chc completion enable zsh
chc completion status zsh
chc completion disable zsh
source <(chc completion zsh)
```

The Bash installer enables zsh completion automatically when zsh is the user's login shell. The PowerShell installer enables PowerShell completion automatically.

## Bundled Scripts

```bash
chc scripts
chc scripts list
chc scripts list --json
chc scripts run convert-to-cbz --input ./samples
```

Bare `chc scripts` prints the public `list` and `run` operations followed by an
`AVAILABLE SCRIPTS` catalog. `chc scripts list` renders the same discovered
catalog; its JSON form returns bounded script ids, titles, and descriptions.
Use `chc scripts run <id>` as the canonical execution form. These compatibility
forms remain supported and route through the same runner:

```bash
chc scripts convert-to-cbz --input ./samples
chc scripts --script convert-to-cbz --input ./samples
chc scripts convert-to-cbz --input ./samples --format jpg --quality 90 --concurrency 4
chc scripts convert-to-cbz --input ./samples --json --no-interactive
```

`convert-to-cbz` scans the input directory recursively, converts `.pdf` and `.epub` files, and writes `.cbz` outputs under `<input>/.output` by default. If `--input` is omitted in non-interactive mode, the command exits non-zero and prints a JSON error when `--json` is set.

## Codex Skills and Plugins

```bash
chc codex skills
chc codex skills --json
chc codex install
```

`chc codex skills` interactively reconciles third-party GitHub skills declared
in the version 2 `codex/skills.manifest.json` with eligible local installations.
The table includes a local installation only when the pinned `skills` backend
can provide supported GitHub repository and selector metadata. Such an entry is
shown as `local_only`; selecting Track records a reviewed branch or pinned ref
in the manifest without reinstalling the skill or copying its directory.

Use Add skills from GitHub when the skill is not installed locally. Space cycles
through the actions valid for a row, Enter previews the resulting local and
manifest changes, and confirmation defaults to No. Self-authored, manually
copied, well-known, plugin-provided, system, non-GitHub, and
provenance-incomplete local skills are ignored. `--json` returns the same
eligible inventory without writing, and the bare command fails safely when no
interactive terminal is available.

Skill discovery, installation, updates, and removal use the reviewed
`npx --yes skills@1.5.19` Codex user-scope backend. The repository does not vendor
skill directories or infer sources from local installations.

`chc codex install` installs repository-owned plugins only. It reads
`codex/plugins.manifest.json`, discovers `codex/plugins`, registers and enables
enabled plugins, and synchronizes their cache. It does not manage standalone
skills, prompts, or rules. The retired `codex status`, `export`, and `apply`
subcommands are rejected as unknown commands.

OpenCode consumes the same repository plugin assets through two explicit
adapter commands:

```bash
chc opencode skills
chc opencode mcp
```

The first adds enabled plugin skill directories to OpenCode's `skills.paths`;
the second converts plugin `.mcp.json` declarations into OpenCode's `mcp`
configuration. Both preserve unrelated configuration and leave `install`
reserved for plugin installation.

Source reference: `apps/cli/README.md`.
