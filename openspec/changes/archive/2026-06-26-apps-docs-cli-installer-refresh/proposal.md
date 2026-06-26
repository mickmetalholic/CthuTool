## Why

The CLI installer now supports local and remote install modes and uses the committed CLI bundle for target-machine installs. The docs site still says the installer installs dependencies and builds the CLI, and it presents `self-update` as the primary update command.

## What Changes

- Update CLI installation docs for committed bundle runtime, target prerequisites, and `CHC_INSTALL_MODE=auto|local|remote`.
- Update CLI module and command reference pages to prefer `chc update` while documenting `chc self-update` as a compatibility alias.
- Document local checkout development install behavior and how to restore the global command to remote-managed mode.
- Link to CLI distribution and self-installation specs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-docs-site`: Refresh CLI user installation and command documentation for the current installer/update behavior.

## Impact

- Affects CLI docs pages under `apps/docs/src/content/docs/client/`, `modules/`, and `reference/`.
- May update package README pointers only if needed.
- No CLI runtime behavior changes are expected.
