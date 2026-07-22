# Verification

Status: implementation complete, 20/20 tasks. The six predecessor changes are
archived/synced, Electron source and publication paths are removed, and the
30-day rollback window is fixed at 2026-07-22 through 2026-08-21. This final
change remains active until separately authorized for archive/sync.

## Completed evidence

- `@cthutool/agent-data-migration`: 12 tests pass for macOS/Windows root
  resolution, environment resolution, locks, retry, idempotence, multiple
  profiles, and source preservation.
- `@cthutool/agent`: 4 process tests pass, including fail-closed migration and
  persistence of the exact matched release environment.
- `@cthutool/cli`: 113 unit tests and 74 integration tests pass, including
  install, environment/secret handling, switch, exit/restart, update/rollback,
  uninstall, migration diagnostics, and redaction.
- `@cthutool/agent-release`: 34 tests pass, including clean-host bundled Node
  smoke, supported-target receipts, and Electron/renderer exclusion guards.
- Root contract/integration tests: 65 tests pass after package-graph cleanup.
- Full Turbo package tests: 21/21 tasks pass across 14 Node workspaces.
- Full Turbo lint: 14/14 tasks pass. Full Turbo typecheck: 21/21 tasks pass.
- Full Turbo build: 14/14 tasks pass.
- Rust tray: `cargo fmt --check`, warnings-as-errors Clippy, 27 library tests,
  2 binary tests, and doc tests pass.
- CLI distribution bundle is rebuilt and `check-cli-dist.sh` reports it current.
- Docs validation succeeds: the 55-spec index is current, 50 pages build, and
  Astro typecheck reports zero diagnostics.
- Native macOS Chrome 150 loopback smoke passes ticket bootstrap, fragment
  clearing, loopback address-space selection, session exchange, and resources.
- Supported-target contract/smoke fixtures cover macOS arm64/x64 and Windows
  x64 bundle layout, signed manifest receipts, install, environment/secret
  isolation, Web bridge, browser lifecycle, switching, coordinated exit,
  update/rollback, preserve-by-default uninstall, and migration.
- `openspec validate --all --strict` passes all 57 specs/changes.
- `git diff --check` passes.

## Removal audit

- `apps/desktop`, `packages/app-shell`, `packages/ui`, and
  `.github/workflows/desktop.yml` are absent.
- `pnpm-lock.yaml` has no matching importers or Electron packaging dependencies.
- The `desktop-artifacts` affected target and Desktop/app-shell/UI coverage
  contracts are absent.
- Remaining Electron literals are deliberate Agent-bundle exclusion guards,
  bounded migration/rollback references, removal specs, or the unrelated
  Obsidian host external. They are not a CthuTool Electron runtime, package,
  script, workflow, or artifact publication path.
- Generated `.claude`, `.codex`, and `.cursor` adapters are unchanged. The
  unrelated `improve-notion-channel-batch-add` change is unchanged.

## Supported-platform boundary

The supported-platform smoke is represented by the checked-in Agent release
matrix and automated clean-host fixtures, plus a native macOS Chrome bridge
probe in this worktree. Protected production signing/publication was not
triggered because the repository intentionally keeps it fail-closed until its
catalog and signing secrets are configured. The first production release must
still pass the macOS and Windows jobs in `agent-release.yml`; no test result is
presented as a signed production artifact.

## Authorized cutover

The user authorized predecessor archive/sync in implementation order, a 30-day
rollback window, and Electron deletion. The latest complete rollback pair is
Actions run `28499984304` at source commit
`66c7f4ec20540158fb897d39cb4c56d6de5f2c3c`; it remains available through
2026-09-29. New Electron publication stops at cutover. Archiving/syncing this
final removal change remains a separate post-verification action.

No GitHub Release exists. No artifact was downloaded, copied, published, or
mutated.
