## Why

Local `chc` installation currently requires manual zsh completion setup and its status command reports the default managed checkout even when the executable is linked to a development checkout. The lifecycle surface also exposes a redundant `self-update` alias and can install an unusable Unix bin shim when the entrypoint is not executable.

## What Changes

- Automatically enable persistent zsh completion during installation when zsh is the login shell, with an explicit opt-out.
- Add idempotent `enable`, `status`, and `disable` lifecycle commands for managed zsh completion.
- Detect the source checkout used by the running `chc` command and report accurate local or remote mode, Git metadata, and bundle presence.
- Commit the Node bin shim with Unix executable permission.
- **BREAKING** Remove the redundant `chc self-update` alias and retain `chc update` as the only update command.
- **BREAKING** Rename the update failure error code from `self_update_failed` to `update_failed`.
- Refresh CLI and docs-site documentation for the consolidated lifecycle behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-self-installation`: Add automatic zsh setup, accurate installation-source status, executable shim requirements, and a single `update` command.
- `apps-cli-shell-completion`: Add managed zsh profile lifecycle behavior and zsh lifecycle completion candidates.
- `apps-cli-agent-contract`: Replace the legacy update failure code and remove `self-update` from command examples.
- `apps-docs-site`: Document `chc update` as the sole update command.

## Impact

- CLI installer, completion/profile management, update command registration, status reporting, and error contracts.
- Root package bin mode and committed `apps/cli/dist/index.js` runtime bundle.
- CLI unit, integration, and installer contract tests.
- Root, package, docs-site, and OpenSpec documentation.
