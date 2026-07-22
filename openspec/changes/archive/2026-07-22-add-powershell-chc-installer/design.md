## Context

The existing Bash installer owns both personal remote installation and local
checkout linking for the `chc` CLI. Its target-machine contract is deliberately
small: Git, Node 24, and npm consume the committed `apps/cli/dist/index.js`
bundle without installing workspace dependencies or running Bun. On Windows,
however, the documented Bash flow requires an additional Unix-like shell and
can accidentally target WSL instead of the native npm/PowerShell environment.

The PowerShell installer must preserve the same source-selection and managed
checkout safety behavior while remaining compatible with Windows PowerShell
5.1 and PowerShell 7.

## Goals / Non-Goals

**Goals:**

- Provide a native PowerShell entry point for public remote installation and
  local checkout development.
- Keep environment-variable overrides and install-source semantics aligned with
  `install-chc.sh`.
- Preserve dirty-checkout, fast-forward, and target-bundle safety checks before
  checkout mutation or global installation.
- Use the existing CLI-owned completion lifecycle for persistent PowerShell
  completion.
- Cover Windows-specific behavior with focused, non-mutating contract tests.

**Non-Goals:**

- Replace or alter the Bash installer.
- Build the CLI or install pnpm/Bun on target machines.
- Change `chc update`, the root npm bin mapping, or the committed runtime
  bundle.
- Perform a real global npm installation during automated tests.

## Decisions

### Add a standalone PowerShell 5.1-compatible installer

The installer uses only built-in PowerShell features plus Git, Node, and npm.
It mirrors the Bash flow instead of invoking Bash or routing through workspace
tooling. This keeps Windows installation native and preserves the lightweight
target contract. Requiring PowerShell 7 was rejected because Windows PowerShell
5.1 remains available on supported Windows client machines.

### Infer local versus remote mode from invocation context

Executing `scripts/install-chc.ps1` as a file selects the repository containing
that script. Evaluating public raw content with `irm ... | iex` has no installer
script path and selects the managed remote checkout. `CHC_INSTALL_MODE` remains
the explicit override. This matches the existing Bash distinction between file
execution and stdin execution without adding a state file.

### Preserve the managed-checkout preflight contract

Remote mode resolves and validates the target commit before changing the live
checkout. Existing managed directories with tracked or untracked changes are
blocked, branches must fast-forward, and the target commit must contain the
committed CLI bundle. The installer never stashes, resets, rebases, or cleans
user work. A simpler clone-or-reset implementation was rejected because it
would diverge from the established updater safety contract.

### Install the root package without lifecycle scripts

After source validation, the installer runs
`npm install -g --ignore-scripts <source>`. The root package's existing `bin`
mapping exposes `chc`, and the committed bundle supplies the runtime. This
avoids accidental `prepare`/`prepack` execution and keeps pnpm/Bun out of the
target flow.

### Delegate profile mutation to `chc completion`

The PowerShell installer calls `chc completion enable powershell` after a
successful install, with `CHC_INSTALL_COMPLETION=none` as the opt-out. Reusing
the CLI's idempotent completion manager avoids duplicating managed-profile block
logic inside the installer.

### Test through mocked commands in isolated PowerShell processes

Contract tests invoke the installer through `pwsh` with mocked Git, Node, npm,
and `chc` commands. They verify local and raw-expression modes plus key failure
guards without changing the developer's global npm installation or shell
profile.

## Risks / Trade-offs

- [Risk] Bash and PowerShell implementations can drift over time. → Keep their
  environment variables, phase ordering, and contract tests aligned.
- [Risk] `irm ... | iex` executes remote content directly. → Keep the local
  checkout path documented for users who want to inspect the script first and
  continue publishing it from the same repository/ref as the Bash installer.
- [Risk] Automatic completion changes a PowerShell profile. → Delegate the
  idempotent edit to `chc completion` and retain the explicit `none` opt-out.
- [Risk] PowerShell contract tests may be skipped on hosts without `pwsh`. →
  Keep parser validation for Windows PowerShell 5.1/7 in the Windows validation
  path and retain static syntax checks.

## Migration Plan

Publish `install-chc.ps1` alongside the existing Bash script, update public and
local documentation, and leave current installations untouched. Users opt into
the new path on their next install or relink. Rollback removes the PowerShell
script and documentation without affecting existing Bash installations or the
`chc` runtime.

## Open Questions

None.
