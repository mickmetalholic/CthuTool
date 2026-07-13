## Context

The global `chc` package is installed from a repository path, so npm links the bin entrypoint and the runtime can recover its real source checkout from `import.meta.url`. The installer supports both a default managed checkout and local development checkouts, while completion currently has a generated zsh adapter but no persistent zsh profile lifecycle.

The change spans installer shell code, CLI command registration, completion/profile management, status reporting, the committed Node bundle, and user-facing documentation. It must keep target requirements limited to Git, Node 24, and npm.

## Goals / Non-Goals

**Goals:**

- Make a normal zsh install immediately usable without manual profile editing.
- Keep completion profile writes idempotent, reversible, and bounded by managed markers.
- Report status from the checkout that actually backs the running global command.
- Expose one update command and one matching failure code.
- Ensure the linked Unix bin entrypoint is executable and the committed runtime bundle is current.

**Non-Goals:**

- Add completion support for shells other than PowerShell and zsh.
- Introduce an installation registry or persistent lifecycle state file.
- Change Git checkout or npm global-install mechanics.
- Assign release versions beyond the existing root package version.

## Decisions

### Delegate zsh profile management to the CLI

The installer invokes `chc completion enable zsh` after global installation when `$SHELL` resolves to zsh. The CLI owns a managed block in `.zshrc`, initializes `compinit` only when needed, migrates the previously documented standalone load line, and provides status/disable operations.

This avoids duplicating profile mutation logic in the installer. Directly appending a line from Bash was rejected because it would lack a symmetric disable path and make idempotency harder to test. `CHC_INSTALL_COMPLETION=none` provides an opt-out, and setup failure is reported as a warning so older refs remain installable.

### Derive status from the running module

Without an explicit `--install-dir` or `CHC_INSTALL_DIR`, status walks upward from the running module until it finds the root `cthutool` package. Git metadata and bundle presence are then read from that checkout.

The standard `~/.cthutool/source/CthuTool` source is reported as `remote`; other linked checkouts are reported as `local`. A persistent state file was rejected because it can become stale when npm links are replaced outside the installer. Explicit `--install-dir` remains available for diagnostics.

### Consolidate update behavior

The root command registers only `update`, removes `self-update` from help and completion, and emits `update_failed` for update failures. Keeping an alias was rejected because this personal CLI does not require a compatibility surface and the duplicate command obscured the preferred lifecycle.

### Treat the bin mode and bundle as release artifacts

`apps/cli/bin/chc.mjs` is committed as executable so npm's linked Unix bin remains runnable. Source changes are rebuilt into the committed `apps/cli/dist/index.js`, and tests verify both the mode bit and bundle freshness.

## Risks / Trade-offs

- [Installer edits a user profile] → Limit edits to a marked block, preserve surrounding content, support disable, and provide an opt-out.
- [A non-default remote checkout is classified as local] → Define `remote` as the standard managed source and retain `--install-dir` for custom inspection; avoid a stale state registry.
- [Removing `self-update` breaks old scripts] → Document `chc update` as the direct replacement and return a clear unknown-command error for the removed alias.
- [Older refs lack managed zsh support] → Treat automatic completion setup failure as a warning after the core install succeeds.

## Migration Plan

1. Install the updated checkout once with `scripts/install-chc.sh` or the public installer.
2. Replace any scripted `chc self-update` invocation with `chc update` and update consumers expecting `self_update_failed` to accept `update_failed`.
3. Allow `chc completion enable zsh` to migrate the old standalone zsh load line into the managed block.
4. Roll back by reinstalling an earlier ref; remove the managed zsh block first with `chc completion disable zsh` when desired.

## Open Questions

None.
