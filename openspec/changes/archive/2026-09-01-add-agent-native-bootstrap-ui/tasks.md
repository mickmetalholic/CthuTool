## 1. Self-use configuration and routing

- [x] 1.1 Define the versioned user-scoped self-use configuration model and paths for `deploymentOrigin`, device metadata, active profile, browser settings, logs, and runtime data.
- [x] 1.2 Implement exact-Origin validation and the derived routes for Web `/agent`, same-origin Backend HTTP, and `wss://<host>/ws/agents`; reject unsupported or malformed origins without silently rewriting user input.
- [x] 1.3 Make self-use resolve to one fixed `self-use` environment/profile and remove its runtime dependency on a packaged deployment URL catalog.
- [x] 1.4 Implement atomic configuration writes, preservation of the last known-good configuration when a candidate update fails, and leave ignored legacy Secret files untouched.
- [x] 1.5 Add migration for the existing single-environment installation state, including explicit handling for old multi-environment data without deleting profiles, logs, or browser settings.
- [x] 1.6 Add unit tests for schema migration, Origin validation/derivation, fixed environment selection, atomic writes, absence of static Secret fields, and failure rollback.

## 2. Agent lifecycle and setup IPC

- [x] 2.1 Add an explicit `SetupRequired` lifecycle state and prevent the Node/headless Agent from starting until a valid self-use Origin is available.
- [x] 2.2 Define a typed, versioned same-user setup IPC protocol for reading safe setup state, validating candidates, applying configuration, opening the Web console, and reporting readiness/errors.
- [x] 2.3 Authenticate and authorize setup IPC using the local installation/user boundary, keep trust-boundary configuration out of command-line arguments, and avoid logging sensitive requests or responses.
- [x] 2.4 Reconnect the Agent after a successful configuration update, invalidate stale bridge sessions when connection parameters change, and keep the previous runtime active until the candidate is verified where possible.
- [x] 2.5 Update tray state, menu actions, and notifications for `SetupRequired`, starting, ready, backend offline, and configuration failure states.
- [x] 2.6 Add lifecycle and IPC tests covering fresh install, authorized/unauthorized clients, apply/reconnect, stale-session invalidation, and no-start-before-setup behavior.

## 3. Native setup application

- [x] 3.1 Add the `apps/agent-setup` Rust workspace crate and lock the selected native UI toolkit/dependency versions after confirming the distribution license and attribution requirements.
- [x] 3.2 Implement one native window with FirstRun and Settings modes, a consistent light/purple visual theme, responsive layout, high-DPI behavior, keyboard navigation, and accessible labels/focus order.
- [x] 3.3 Implement the first-run wizard with Origin and device-name inputs, clear validation errors, cancel behavior, and a verify/apply progress state.
- [x] 3.4 Implement the later Settings view with the current Origin, device information, connection status, endpoint preview, Save/Reconnect, Reset/clear actions where supported, and Open Web Console.
- [x] 3.5 Ensure the UI displays actionable errors returned by the tray IPC service and never exposes obsolete static-credential configuration.
- [x] 3.6 Add native application tests or deterministic UI/state tests for first-run, cancel, invalid Origin, failed verification, successful apply, reopening settings, and Web console launch.

## 4. Tray, Web, and native/UI boundary

- [x] 4.1 Launch the native setup application automatically once when the tray detects `SetupRequired`, while keeping the tray usable if the setup window is closed or crashes.
- [x] 4.2 Add tray actions for opening Agent Settings and the deployed Web `/agent` console, using the configured Origin and a fresh authenticated bridge session.
- [x] 4.3 Keep deployment Origin ownership in the native/tray configuration path; make Web configuration surfaces read-only for this field and reject unsupported trust-boundary mutations.
- [x] 4.4 Preserve the Web console as the surface for Profile, Chrome/browser, and other complex operational settings, and document the boundary between native bootstrap settings and Web settings.
- [x] 4.5 Add integration tests for tray-to-setup IPC, tray-to-Web launch, configuration ownership, and behavior when the Web/Backend endpoint is unavailable.

## 5. CLI and installation lifecycle

- [x] 5.1 Change `chc agent settings` to open the native first-run/settings window and remove self-use configuration flows that require selecting a catalog environment or passing a raw Secret.
- [x] 5.2 Update `chc agent status` and `chc agent doctor` to report setup/configuration/readiness/Backend status with safe JSON and text redaction.
- [x] 5.3 Update install, start, stop, restart, autostart, update, rollback, and uninstall flows to package/use the native setup executable and preserve user-scoped Origin, profiles, logs, browser settings, and ignored legacy Secret files by default.
- [x] 5.4 Remove self-use catalog selection from CLI help, shell completion, and error messages; retain only explicitly supported development/custom-environment behavior.
- [x] 5.5 Add CLI tests for SetupRequired output, settings launch, migration, update/rollback preservation, uninstall preservation, and absence of static Secret fields.

## 6. Release artifacts and CI packaging

- [x] 6.1 Update macOS and Windows release builds to compile and package the native setup executable alongside the tray and headless Agent binaries.
- [x] 6.2 Remove deployment URL catalogs and local WebView/HTML assets from the self-use artifact contract; keep only non-secret runtime metadata required by the native setup and Agent.
- [x] 6.3 Update release manifests, inventory checks, integrity checks, archive layout, and platform launch metadata for the additional native executable and mutable user-data directories.
- [x] 6.4 Add clean-host packaging smoke tests that verify a fresh archive reaches `SetupRequired`, a configured archive reaches Agent readiness, and no forbidden URL or credential is embedded in the artifact.
- [x] 6.5 Update CI failure diagnostics and release documentation so native setup packaging failures are distinguishable from Agent runtime or Backend connectivity failures.

## 7. Verification and documentation

- [x] 7.1 Run Rust formatting, targeted Rust tests, affected TypeScript/ESLint/type checks, and `git diff --check` for the changed areas.
- [x] 7.2 Run `openspec validate add-agent-native-bootstrap-ui --strict` and resolve all specification/task consistency errors.
- [x] 7.3 Perform macOS and Windows acceptance checks for first launch, settings reopening, Origin validation, Web console handoff, update, and uninstall data preservation.
- [x] 7.4 Document the self-use release workflow, first-run configuration, derived endpoint rules, supported troubleshooting commands, and the native/Web settings boundary.
- [x] 7.5 Confirm generated `.claude/`, `.codex/`, and `.cursor/` adapter files remain unchanged unless explicitly regenerated by the project workflow.

## Review follow-ups

- [x] R1 Preserve self-use `schemaVersion` and `deploymentOrigin` when the runtime compatibility layer loads the configuration; add a restart regression test.
- [x] R2 Let CLI settings wait for the tray without requiring a headless Agent instance, and pass the selected user-data directory to every native setup launch.
- [x] R3 Verify candidate Origin against the real Backend WebSocket before committing; restore the previous configuration if the tray cannot schedule the restart.
- [x] R4 Make malformed configuration recoverable through native setup and merge unambiguous legacy environment data into `self-use` after native bootstrap.
- [x] R5 Remove obsolete static Secret persistence/ACL behavior and misleading signed-bundle diagnostics.
- [x] R6 Extend release/native smoke coverage and fix native setup UI interaction/accessibility issues found during review.
