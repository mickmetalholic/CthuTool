## 1. Runtime composition and local control

- [ ] 1.1 Extract the current Agent process composition into a lazy CLI daemon entrypoint and lightweight runtime/control exports; verify help/version/completion do not initialize Playwright and both launch modes use the same runtime bootstrap.
- [ ] 1.2 Remove HTTP bridge creation and bridge/environment operations from runtime control/health while introducing the expanded control protocol version; verify no loopback HTTP listener starts and old/incompatible management requests perform no mutation.
- [ ] 1.3 Add typed bounded configuration and Profile control operations with same-user endpoint/record permissions and nonce/process validation; verify unauthorized, oversized, stale-instance, and incompatible-protocol requests fail on Unix and Windows.
- [ ] 1.4 Route local management browser work through the shared execution/ownership facade; verify a Backend session and local Profile mutation cannot concurrently delete or corrupt the same Profile.

## 2. Canonical CLI lifecycle and configuration

- [ ] 2.1 Register `chc daemon` setup/config/start/stop/restart/status/logs/doctor/profile/autostart commands and remove the supported Agent group; verify static help/completion/registry tests and actionable `chc agent` migration output.
- [ ] 2.2 Implement foreground/background launch, build identity, bounded readiness, and idempotent start with exact instance ownership; verify real isolated child processes survive CLI exit and duplicate/stale/PID-reuse cases never create or kill an unrelated runtime.
- [ ] 2.3 Implement terminal and non-interactive single-Origin setup plus one-writer config mutation with transient-ID candidate verification; verify offline stopped setup, invalid input, startup races, candidate failure preservation, and successful reconnect using controlled Backend fixtures.
- [ ] 2.4 Implement graceful stop/restart and supported signal handling with bounded escalation; verify new work is rejected, owned browser resources close, locks release, and escalation rechecks live identity.
- [ ] 2.5 Implement read-only status/config show/doctor and stopped log access with stable JSON/errors; verify byte-for-byte unchanged user data during read-only commands, independent process/Backend/browser facts, redaction, and watcher cleanup after followed-log interruption.

## 3. Local Profile workflows and legacy data

- [ ] 3.1 Implement Profile listing, visible login, and verification through local control using explicit/challenge URLs; verify login contexts outlive the command, verification updates safe metadata, and missing GUI/Chrome prerequisites are reported without false login success.
- [ ] 3.2 Implement confirmed Profile removal with use/lock checks; verify only the selected unlocked Profile is deleted and absent confirmation or active Backend/login use preserves its contents.
- [ ] 3.3 Implement identity-checked legacy tray/Agent takeover and migration-only compatibility control, retaining the migration library as needed; verify old self-use device IDs/Profiles/logs remain at existing paths, only owned startup registrations are removed, ambiguous namespaces fail safely, and setup alone does not start the new daemon.

## 4. Cross-platform service adapters

- [ ] 4.1 Implement current-user macOS LaunchAgent query/register/start/stop/restart/refresh behavior with failure-only recovery and native throttling; verify absolute launch paths, explicit managed stop without resurrection, and no duplicate unmanaged owner in isolated macOS lifecycle tests.
- [ ] 4.2 Implement Windows current-user scheduled tasks with interactive-token logon and finite failure retry settings; verify registration XML/quoting, no persisted user password, stop/restart ownership, and visible owned Chrome login in a real interactive user-session acceptance run.
- [ ] 4.3 Implement systemd user units on Linux with failure restart/rate limiting and explicit no-systemd fallback; verify managed lifecycle in a usable user-manager test environment plus unmanaged operation/unavailable registration without systemd or automatic privilege/linger changes.
- [ ] 4.4 Implement enable/disable/status semantics, active-launch versus future-registration state, and explicit restart handover across adapters; verify disabling registration preserves the running daemon and a later restart creates exactly one owner using the selected mode.

## 5. Unified CLI installation and source updates

- [ ] 5.1 Extend root package inventory and production runtime dependencies/resources for the daemon artifact, Playwright, and WebSocket transport; verify the installed CLI under Node 24 runs outside the checkout with install scripts disabled and no developer workspace dependencies or browser download.
- [ ] 5.2 Extend CLI build/committed-artifact validation, precommit affected inputs, and required-safe CLI CI for shared runtime/protocol/migration inputs; verify a shared-runtime-only change triggers distribution checks and unrelated planning-only changes retain the successful skip behavior.
- [ ] 5.3 Add daemon-aware source-update preflight and owned process/registration state capture; verify target-payload failures, check-only/no-op/blocked updates, and installation conflicts leave running daemons and registrations unchanged.
- [ ] 5.4 Coordinate actual update shutdown, source/install application, owned path refresh, and restart of previously running instances; verify stopped instances remain stopped and another installation's daemon/registration is never controlled.
- [ ] 5.5 Add bounded failure recovery and accurate resulting-state output after shutdown/update/readiness failure; verify restoration only uses verifiable payloads, data is preserved, no checkout reset/stash occurs, and output never claims nonexistent bundle/whole-CLI rollback.

## 6. Retire old application and Web boundaries

- [ ] 6.1 Remove standalone Agent/tray/setup application code and build references after the CLI/migration path is functional; verify workspace/build configuration and package imports have no dependency on the retired applications while migration fixtures still pass.
- [ ] 6.2 Remove `packages/agent-release`, Agent-only GitHub workflow/build action/target/catalog assets, and independent `agent-latest` installer/update paths; verify root/CLI dependency checks and CI affected-workflow tests no longer resolve those artifacts or require a Rust build.
- [ ] 6.3 Remove Web `/agent` and `/agent/help`, the dedicated bridge client/tests, route-only proxy/CSP/headers, aliases, and `agent-bridge-protocol`; verify removed routes return not found, Web checks pass, retained generic redaction remains effective, and runtime/Web contain no live Bridge import or bootstrap endpoint.
- [ ] 6.4 Update repository-owned CLI/browser/architecture/deployment/SDK guidance and package maps for the new commands and fixed self-use Backend environment; verify links/help examples, wire-compatibility statements, host Chrome prerequisites, and removal of canonical old Agent/Web-console instructions outside historical/protected material.

## 7. Browser SDK archive distribution

- [ ] 7.1 Add a minimal SDK packed-file allowlist and reproducible build/pack path retaining `private: true` and zero daemon/Playwright/workspace runtime dependencies; verify tarball inventory contains all declared JS/declaration entrypoints and documentation.
- [ ] 7.2 Add clean external npm and pnpm archive-consumer tests for runtime import, public TypeScript use, and a bounded request to a controlled Backend HTTP fixture; verify tests use the exact packed archive without source-checkout resolution, consumer build hooks, Chrome, or daemon access.
- [ ] 7.3 Add independent tag-driven `browser-client-vX.Y.Z` GitHub Release validation/publication with version/source/digest matching and conflict refusal; verify PR dry validation publishes nothing, mismatched tags/existing bytes fail, and npm publication/token permissions are absent.
- [ ] 7.4 Document fixed-version Release URL install/upgrade and preserved `CthuBrowserClient`/`withPage` examples; verify documented npm/pnpm commands against an archive fixture and that API limitations, remote Profile ownership, and the current Backend trust boundary remain accurate.

## 8. Integration and completion checks

- [ ] 8.1 Add packed-distribution lifecycle coverage on macOS, Windows, and Linux with isolated data/service names and owned-process cleanup; verify foreground/background, missing configuration/Chrome, Backend offline, active service stop, and stale registration behavior without touching developer processes.
- [ ] 8.2 Verify Backend-to-daemon-to-host-Chrome and SDK-to-Backend browser-session parity, including navigation/extraction/screenshot, Profile login challenges, session ownership, disconnect failure, and no automatic action replay; run affected Backend/runtime/SDK integration suites using controlled sites.
- [ ] 8.3 Run affected lint, type, unit/integration, Web route, CLI distribution, and SDK package checks once their inputs are implemented; verify failures are resolved and `git diff --check` passes without unrelated checkout or service changes.
- [ ] 8.4 Run `openspec validate apps-cli-unify-daemon --strict` and review the final scoped diff; verify generated `.agents`/`.zcode` skills, `codex/plugins/cthu-codex`, neighboring changes, and main-spec synchronization/archive remain untouched unless separately authorized.
