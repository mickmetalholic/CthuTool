## Why

The Agent should be installable and operable through the existing `chc` entry point rather than a second installer or settings application. A dedicated command group gives the single operator one consistent way to install, configure environment access, start, inspect, update, and remove the tray-plus-Agent service.

## What Changes

- Add `chc agent install`, `start`, `stop`, `restart`, `status`, `settings`, `logs`, `doctor`, `update`, `uninstall`, and `autostart enable|disable` commands.
- Add `chc agent env list|get|set|set-secret` so environment selection and per-environment public-backend Agent secrets can be configured without a native settings window.
- Make secret input available only through stdin or a protected file, never a required command-line argument or output field.
- Download and verify the platform bundle and environment catalog from the signed release manifest, install it to user-scoped versioned paths, and atomically activate or roll back versions.
- Make `settings` open the active environment's deployed Web application with a fresh one-time local-bridge bootstrap fragment; the Agent serves no UI assets.
- Make `stop` use the same coordinated shutdown path as tray Exit; do not leave a tray-only or paused mode.
- Manage user-session autostart with platform adapters and exact process/control-endpoint identity instead of broad process-name termination.
- Preserve environment configuration/secrets and browser profiles on uninstall by default; require explicit `--purge` confirmation for local data deletion.
- Provide stable human-readable output and structured `--json` status/diagnostic output without secret values.

## Capabilities

### New Capabilities

- `apps-cli-agent-lifecycle`: CLI installation, lifecycle control, environment configuration, deployed-Web access, autostart, diagnostics, update/rollback, and uninstall behavior for the local Agent.

### Modified Capabilities

None. Existing command discovery invariants apply to the new command group without changing their requirements.

## Impact

- Affects the CLI command registry, platform filesystem/process/secret-store adapters, release download verification, documentation, and integration tests.
- Consumes the release manifest/catalog from `add-agent-release-artifacts` plus tray, environment-routing, and local-bridge control contracts.
- Keeps `chc update` scoped to the CLI itself; Agent updates live under `chc agent update`.
