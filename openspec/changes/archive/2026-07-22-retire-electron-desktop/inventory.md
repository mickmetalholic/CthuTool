# Electron retirement inventory

Inventory date: 2026-07-22

## Cutover gate

All six predecessor implementations report `isComplete: true` and have local
verification evidence:

1. `extract-local-agent-runtime`
2. `add-agent-environment-routing`
3. `add-web-agent-local-bridge`
4. `add-native-agent-tray`
5. `add-agent-release-artifacts`
6. `add-cli-agent-lifecycle`

They were archived/synced in the listed implementation order on 2026-07-22.
Their requirements are represented in `openspec/specs`, and
`openspec validate --all --strict` passes for all 57 active specs/changes.

Read-only GitHub inspection found no GitHub Release, but did find the latest
complete macOS and Windows Electron workflow artifacts from successful push run
`28499984304` at source commit
`66c7f4ec20540158fb897d39cb4c56d6de5f2c3c`:

- `cthudesktop-macOS`, artifact `8002612899`, 522,126,550 bytes
- `cthudesktop-Windows`, artifact `8002626270`, 299,958,245 bytes

Both were created 2026-07-01 and are currently retained by GitHub Actions until
2026-09-29. This is the concrete rollback baseline, but it remains an unsigned
CI artifact rather than a signed production release. The authorized rollback
window starts at cutover on 2026-07-22 and ends after 2026-08-21 (30 calendar
days). The current artifact retention covers the whole window with margin.
No new Electron artifacts are published after cutover.

## Platform parity evidence

The predecessor verification covers macOS arm64/x64 and Windows x64 release
artifacts; per-user tray startup/autostart; exact tray/Agent identity and local
control; signed catalog install/update/rollback; environment selection and
secret storage; deployed-Web launch and loopback bridge; browser/profile
operations; diagnostics; coordinated exit; and preserve-by-default uninstall.

Post-cutover verification ran the supported-target release contract and
clean-host fixtures plus a native macOS Chrome loopback smoke. Protected
production signing/publication remains fail-closed until its catalog and
signing inputs are configured; the first production Agent release must pass the
real macOS and Windows jobs before publication.

## Source and dependency inventory

| Category | Current inventory | Cutover action |
| --- | --- | --- |
| Electron app | `apps/desktop` had 35 tracked source/config/test/asset files excluding `node_modules` | Removed at cutover |
| Electron package/runtime | `electron`, `electron-builder`, `electron-vite`, renderer React/Vite/Tailwind dependencies and package scripts in `apps/desktop/package.json` | Removed; lockfile regenerated |
| Main/preload/renderer | `src/main`, `src/preload`, `src/renderer`, Desktop tests, Electron Vite config, icons | Removed |
| Packaging workflow | `.github/workflows/desktop.yml` published macOS/Windows Electron artifacts | Removed; identified rollback run retained for 30 days |
| Affected filter | `desktop-artifacts` target in `scripts/ci/affected-workflow.mjs` | Removed with contract cases |
| CI coverage | `.github/workflows/ci.yml` and contract tests referenced Desktop/app-shell/UI summaries | Retired entries removed; unrelated gates preserved |
| Contract tests | Root contracts encoded Desktop/app-shell/UI behavior | Updated and passing |
| Lockfile | `pnpm-lock.yaml` contained the Desktop importer plus Electron packaging graph | Regenerated with no stale importer/dependency |
| Shared app shell | `packages/app-shell` had 13 files and no consumer outside Desktop/tests | Removed |
| Shared UI/theme | `packages/ui` had 24 files and no consumer outside Desktop/app-shell | Removed |
| Documentation | Legacy references are concentrated in coverage history, transition/migration docs, main old specs, and the gated source inventory | Keep bounded rollback/migration history; remove obsolete runtime instructions |
| OpenSpec main specs | Six `apps-desktop-*` specs plus app-shell/UI references describe the retiring product | Keep this change active during implementation; archive/sync it only after verification and separate authorization |

References to the word `Electron` in Agent bundle validators and tests are
negative security assertions, not runtime/package/publication dependencies.
They should remain after cutover to prevent renderer or Electron content from
entering UI-free Agent releases.

## Douban decision

`apps/web` has no Douban movie lookup page or consumer. The backend still owns
the Douban movie information module and backend-routed browser capability. The
legacy Desktop-only lookup surface is therefore an intentional client-product
removal, not a claimed Web replacement. This decision is recorded in the user
docs and must be carried into the removed-requirement migration note when the
change is archived.

## Non-destructive work completed before cutover

- Added `@cthutool/agent-data-migration` with exact trusted-environment
  resolution, explicit-selection fallback, exclusive locking, staged copy,
  content validation, idempotent per-environment markers, and source retention.
- Wired migration into Agent startup before browser profile ownership.
- Added redacted `chc agent doctor` migration status and repair commands.
- Made signed Agent installation, catalog environment selection, fresh static
  secrets, native tray, deployed Web settings, update/rollback, logs, and
  preserve-by-default uninstall the documented default path.

The cutover gate opened on 2026-07-22 after explicit authorization of the
30-day window, predecessor archive/sync, and Electron deletion.
