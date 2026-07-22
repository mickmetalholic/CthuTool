## Context

`chc` is the existing user entry point, but it has no lifecycle contract for an independently packaged local Agent. The CLI must orchestrate release verification, user-scoped installation, environment selection and secret configuration, tray startup, same-user local control, autostart, updates, diagnostics, Web launch, and uninstall consistently across platforms.

Some selected backends may be public. The product is still single-operator, so the CLI needs only a static Agent secret per environment, not device enrollment or a credential lifecycle. It must not place secrets in process listings, logs, JSON output, or browser bootstrap fragments.

## Goals / Non-Goals

**Goals:**

- Provide a coherent `chc agent` namespace for the complete user lifecycle.
- Configure one active catalog environment and its optional/required Agent secret safely.
- Verify releases and switch versions atomically with rollback.
- Control the exact tray/Agent through user-scoped IPC and instance identity.
- Open the deployed Web route and preserve mutable data unless explicitly purged.

**Non-Goals:**

- Device enrollment, secret rotation/revocation workflows, RBAC, or multiple local operators.
- Updating `chc` itself through `chc agent update`.
- Providing a GUI installer, native settings window, or privileged machine-wide service.

## Decisions

### Register one public `agent` command group

The group contains lifecycle commands plus `env list|get|set|set-secret`. Bare `chc agent` prints group help through the existing static discovery system. Commands share lifecycle and environment services rather than implementing platform logic in handlers.

`env list` reads the verified catalog and shows connection/secret-configuration status, never values. `env get` reports the active environment. `env set <id>` asks the running Agent to execute the same complete switch contract used by the tray, or changes the persisted selection if stopped. `env set-secret <id>` accepts the value from `--secret-stdin` or `--secret-file`, stores it using user-scoped protected storage, and never echoes it.

### Consume only verified release contracts

`install` and `update` resolve a channel or explicit version to a signed manifest, enforce schema/minimum-CLI/protocol/catalog compatibility, verify the platform archive, extract safely without path traversal, run layout/smoke validation, and atomically switch the active version. A failed activation restores the previous pointer and reports retained failure logs.

### Operate at user-session scope and control exact instances

Default roots follow platform user application-data conventions. Autostart uses LaunchAgent on macOS and per-user startup registration on Windows. Commands read the protected instance record and perform a versioned same-user handshake before status, Web launch, environment switch, or shutdown. `stop` invokes the same coordinated tray Exit path. Stale records are repaired only after validating PID, executable, nonce, and endpoint; no reusable local-control credential is persisted.

### Open the deployed Web route, not a local UI

`settings` is retained as the familiar command name but means “open CthuTool.” It starts the tray when needed, asks the Agent for a one-time bridge ticket, and opens the active catalog environment's deployed Web URL with endpoint, ticket, and environment in the fragment. The ticket is short-lived and single-use; neither it nor the resulting in-memory bridge token enters CLI output.

### Keep mutable data separate and deletion explicit

Uninstall removes autostart and versioned binaries after stopping the Agent. Environment selection, static Agent secrets, profiles, and logs remain by default. `--purge` requires explicit interactive confirmation unless an existing CLI-safe non-interactive confirmation convention is used; JSON output records only categories removed.

### Make diagnostics scriptable

All read/lifecycle commands support stable result codes and `--json`. `doctor` checks installation/catalog integrity, active environment, whether a required Agent secret is configured, active version, autostart, instance identity, local control, backend state, deployed Web origin, Chrome discovery, profile locks, and redacted log accessibility without printing any secret.

## Risks / Trade-offs

- [Secret leaks through shell history] -> Forbid raw secret arguments and require stdin or protected-file input.
- [Environment changes while commands are active] -> Reuse the Agent's complete switch contract and report transitional/failure states.
- [Update replaces a running binary] -> Stage, coordinate shutdown, switch atomically, health-check, and roll back on failure.
- [Stale PID points to another process] -> Require executable, nonce, endpoint, and same-user protocol validation before termination.
- [Uninstall destroys valuable sessions] -> Preserve data by default and make purge category-aware and explicit.

## Migration Plan

1. Add command registration and lifecycle/environment service interfaces with fixtures.
2. Implement install, environment configuration, status, settings, start, and stop against unsigned local development fixtures.
3. Add signed manifest/catalog verification, update/rollback, platform autostart, logs, and doctor.
4. Publish documentation and machine-readable output contracts.
5. Keep Electron installation untouched until the retirement change; rollback removes Agent autostart and restores the prior active version.

## Open Questions

- Decide the production default release channel and whether pre-release channels are exposed initially.
- Confirm the existing CLI convention used for non-interactive purge confirmation.
