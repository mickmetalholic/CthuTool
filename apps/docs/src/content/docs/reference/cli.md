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

Use `chc --version` for the lightweight version-only check. `chc status` includes that version, reports the detected `local` or `remote` installation mode, and inspects the source checkout used by the running command. `chc status --install-dir <path>` overrides automatic source detection.

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

`chc codex skills` interactively manages third-party GitHub skills declared in
the version 2 `codex/skills.manifest.json`. Its table shows only manifest entries;
unrelated local skills are ignored. Space cycles through the actions valid for a
row, Enter previews the resulting local and manifest changes, and confirmation
defaults to No. The Add path discovers selectable skills from a GitHub repository
and records a branch or pinned ref. `--json` is read-only, and the bare command
fails safely when no interactive terminal is available.

Skill discovery, installation, updates, and removal use the reviewed
`npx --yes skills@1.5.19` Codex user-scope backend. The repository does not vendor
skill directories or infer sources from local installations.

`chc codex install` installs repository-owned plugins only. It reads
`codex/plugins.manifest.json`, discovers `codex/plugins`, registers and enables
enabled plugins, and synchronizes their cache. It does not manage standalone
skills, prompts, or rules. The retired `codex status`, `export`, and `apply`
subcommands are rejected as unknown commands.

Source reference: `apps/cli/README.md`.
