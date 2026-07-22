## 1. Cutover Gate

- [x] 1.1 Confirm the six predecessor changes are applied, verified, archived/synced in implementation order, and represented in main specs.
- [x] 1.2 Complete macOS/Windows parity for install, public-backend Agent/operator access, environment selection/switching, Web bridge, browser/login/profiles, diagnostics, tray exit, autostart, update/rollback, and uninstall.
- [x] 1.3 Inventory every `apps/desktop`, Electron, app-shell, UI, theme, workflow, documentation, and release dependency before deletion.
- [x] 1.4 Confirm whether the desktop Douban lookup has a Web replacement or is an intentional product removal.

## 2. Legacy Data Migration

- [x] 2.1 Detect legacy Electron config/profile roots and resolve the legacy backend to exactly one trusted catalog environment, requiring explicit selection when ambiguous.
- [x] 2.2 Implement idempotent non-destructive copy/transform into that environment's Agent-owned paths with exclusive locking, validation, and per-environment markers.
- [x] 2.3 Require new static Agent-secret configuration rather than reusing legacy device credentials, and add redacted `chc agent doctor` repair/retry output.
- [x] 2.4 Test fresh install, exact/ambiguous/no environment match, multiple profiles, interrupted/repeated migration, active-lock conflict, and rollback-original preservation.

## 3. Distribution Cutover

- [x] 3.1 Make signed UI-free Agent artifacts, `chc agent install`, and deployed CthuTool Web the documented/default supported path.
- [x] 3.2 Stop publishing new Electron artifacts while retaining the last supported artifact and rollback instructions for the agreed window.
- [x] 3.3 Update naming, architecture, installation, environment configuration, Web access, troubleshooting, logs, update, uninstall, and migration docs.

## 4. Electron Removal

- [x] 4.1 Remove `apps/desktop`, renderer/preload/main code, desktop tests, Electron configuration, and desktop-only assets.
- [x] 4.2 Remove the Electron packaging workflow, root scripts/filters, lockfile dependencies, and release references with no remaining consumer.
- [x] 4.3 Remove `packages/app-shell` or shared UI/theme code only after repository and dependency-graph checks prove no Web consumer remains.
- [x] 4.4 Remove obsolete docs and update remaining browser/Agent/environment terminology and links.
- [x] 4.5 Verify no Electron runtime, package, script, workflow, or artifact reference remains outside bounded rollback documentation.

## 5. Final Verification

- [x] 5.1 Run affected workspace lint, TypeScript, unit/integration, package-graph, and `git diff --check` validation after deletion.
- [x] 5.2 Run clean supported-platform install, environment/secret configuration, public access, Web bridge, browser control, environment switch, exit/restart, upgrade/rollback, uninstall, and migration smoke tests.
- [x] 5.3 Run strict OpenSpec validation and confirm every removed requirement has explicit reason and migration paths.
- [x] 5.4 Confirm generated agent adapters and neighboring OpenSpec changes remain unchanged.
