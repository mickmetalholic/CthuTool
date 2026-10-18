---
name: cthutool-cli
description: Operate the CthuTool chc CLI for source switching and updates, local Agent lifecycle, Codex skills/plugins, Obsidian agent links, bundled scripts such as PDF/EPUB-to-CBZ conversion, and shell completion. Use for CthuTool CLI operation or troubleshooting requests, not general terminal work or changes to the CthuTool implementation.
---

# CthuTool CLI

Use the installed `chc` to carry out the user's requested operation and verify
its result. This skill works from any directory; a CthuTool source checkout is
needed only when the chosen operation explicitly targets one.

## Discover the active CLI

Run `chc --version`, then read help for the relevant group and operation.
The installed command's help is authoritative when it differs from this guide.
If `chc` cannot start, inspect command resolution (`Get-Command chc` in
PowerShell or `command -v chc` in POSIX shells) and report the missing or broken
installation. Install or switch sources only when that repair is authorized.

| User's goal | Command family |
| --- | --- |
| Inspect, switch, or update the CLI source | `chc source` |
| Install, update, control, or diagnose the local Agent | `chc agent` |
| Manage third-party GitHub skills or repository plugins | `chc codex` |
| Configure/check a vault's agent skill links | `chc obsidian agents` |
| Discover/run a bundled script or convert comics | `chc scripts` |
| Generate or manage PowerShell/zsh completion | `chc completion` |

Read the relevant section of [workflows](references/workflows.md) for operational
details. Do not load unrelated sections or substitute deprecated root aliases.

## Run and verify

- Prefer supported `--json --no-interactive` flags and explicit target arguments
  for agent execution. Help and `--version` are text operations. Follow-mode
  Agent logs cannot be combined with JSON.
- Parse exactly the command's actual response shape and exit code. There is no
  universal `result` wrapper: script listing uses `scripts`, conversion uses
  `summary`, and lifecycle commands have their own payloads. Keep stderr
  diagnostics separate from JSON stdout.
- Preserve selected checkout, vault, input/output directories, and conflict
  policy. A read-only request authorizes inspection; it does not imply updating,
  relinking, installing plugins, overwriting files, or purging Agent data.
- A clear request already authorizes its scoped operation and verification.
  Continue without routine reconfirmation. Ask only for missing target decisions,
  materially expanded effects, or confirmation required by the selected command.
- Supply `--yes` only when the corresponding setup or purge is already authorized;
  it is not a generic way to bypass an unresolved decision.
- Verify with the operation's status command or result counts. Distinguish
  successful inspection from healthy state, skipped conversion from converted
  output, and rolled-back Agent updates from successful activation.

Report the outcome, affected target, useful verification evidence, and any
remaining issue. If a flag or operation is unavailable, report that version's
limitation instead of inventing a replacement command.
