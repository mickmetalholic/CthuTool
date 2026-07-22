## 1. Command and Platform Foundations

- [x] 1.1 Confirm release manifest/catalog, tray local-control, environment-routing, and local-bridge contracts are applied as test fixtures.
- [x] 1.2 Register the public `chc agent` group and all lifecycle, autostart, and `env list|get|set|set-secret` subcommands through the static registry.
- [x] 1.3 Define shared lifecycle/environment service interfaces, stable result/error codes, and versioned `--json` response schemas.
- [x] 1.4 Implement user-data/install roots, protected secret storage, active pointer, exact-instance, browser-open, and autostart adapters.

## 2. Install and Integrity

- [x] 2.1 Implement signed manifest resolution and schema/minimum-CLI/platform/Agent-protocol/bridge/catalog compatibility checks.
- [x] 2.2 Implement archive download, size/digest verification, safe extraction, environment-catalog validation, layout validation, and staged version rename.
- [x] 2.3 Implement atomic active-version selection and failure cleanup while preserving the previous version and all mutable data.
- [x] 2.4 Add install tests for tampering, unsafe catalog endpoints, path traversal, unsupported target, interrupted extraction, and idempotent reinstall.

## 3. Environment and Runtime Access

- [x] 3.1 Implement `env list|get|set` for verified catalog environments, one authoritative active environment, and running/stopped selection semantics.
- [x] 3.2 Implement `env set-secret` using stdin/protected-file input and user-scoped protected storage, with redaction tests for argv, logs, human output, and JSON.
- [x] 3.3 Implement idempotent start and exact same-user instance/readiness detection without process-name matching or persistent local-control credentials.
- [x] 3.4 Implement stop and restart through the tray-owned coordinated shutdown path with bounded confirmation.
- [x] 3.5 Implement human and JSON status covering install/version, tray/process, active environment, secret-configured flag, backend, autostart, and browser readiness.
- [x] 3.6 Implement `settings` with auto-start-when-stopped and a fresh one-time deployed-Web bridge launch URL.
- [x] 3.7 Implement `logs` read/follow behavior against the redacted Agent-owned log source.

## 4. Autostart, Update, and Diagnostics

- [x] 4.1 Implement idempotent per-user macOS and Windows autostart enable/disable/status adapters for the authoritative tray launcher.
- [x] 4.2 Implement verified Agent update with staged activation, coordinated restart, catalog/readiness checks, retained prior version, and automatic rollback.
- [x] 4.3 Preserve separation between CLI `chc update` and local-Agent `chc agent update` in help, behavior, and tests.
- [x] 4.4 Implement `doctor` checks for install/catalog integrity, active version/environment, secret-configured status, autostart, instance identity, local control, backend/Web origin, Chrome, profile locks, and logs.

## 5. Uninstall and Data Safety

- [x] 5.1 Implement default uninstall that stops the Agent and removes managed autostart/binaries while reporting preserved mutable data.
- [x] 5.2 Implement category-aware `--purge` with explicit interactive and non-interactive confirmation semantics.
- [x] 5.3 Add tests proving default uninstall preserves environment selection, Agent secrets, profiles, and logs and unconfirmed purge deletes nothing.

## 6. Verification and Documentation

- [x] 6.1 Update CLI help/completion/reference docs and test public command discovery invariants for every `chc agent` subcommand.
- [x] 6.2 Run targeted CLI lint, TypeScript checks, unit/integration/platform-fixture tests, JSON schema tests, and `git diff --check`.
- [x] 6.3 Run strict OpenSpec validation and a clean install/env-config/start/settings/switch/stop/update-rollback/uninstall smoke sequence.
- [x] 6.4 Confirm generated agent adapters and unrelated OpenSpec changes remain unchanged.
