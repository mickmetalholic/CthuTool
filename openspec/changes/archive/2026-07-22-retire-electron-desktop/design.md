## Context

This is the final cutover. It assumes the headless runtime, single-user environment routing, deployed-Web local bridge, native tray, signed UI-free Agent artifacts, and `chc agent` lifecycle are implemented and validated. Until then, Electron remains the compatibility host and must not be removed.

The desktop app owns legacy configuration/profile paths and several UI-only capabilities. Retirement must distinguish behavior migrated to the Agent or deployed Web from intentionally removed UI, while retaining shared packages still used elsewhere.

## Goals / Non-Goals

**Goals:**

- Make the tray-plus-Agent architecture the only supported local browser-control client.
- Make the deployed Web application the only supported interactive management UI.
- Migrate supported mutable data into environment-scoped roots without losing profiles.
- Remove Electron runtime, renderer, preload, packaging, CI, and obsolete documentation.

**Non-Goals:**

- Porting the desktop business workspace into the tray or an Agent-served page.
- Adding device enrollment, RBAC, or automated credential lifecycle during cutover.
- Removing shared UI packages that still have Web consumers or combining cutover with unfinished predecessor work.

## Decisions

### Gate removal on a written parity checklist

The cutover requires passing supported-platform scenarios for installation, static Agent authentication to a potentially public backend, the single-operator public access boundary, tray/CLI environment selection, complete environment switching, deployed-Web bridge bootstrap, browser commands and profiles, diagnostics, tray startup/exit, autostart, update/rollback, and uninstall/data preservation.

Calendar-based removal is rejected because profile, browser-control, and public-access regressions are difficult to recover after Electron is uninstalled.

### Migrate data into a resolved environment scope

On first Agent launch or explicit CLI migration, detect the legacy Electron data root and resolve its legacy backend to exactly one trusted catalog environment. If no unique exact match exists, require explicit `chc agent env set` before profile migration. Acquire exclusive locks, copy/transform supported configuration and profiles into that environment's Agent-owned mutable root, validate the result, and write an idempotent per-environment migration marker.

Keep original data until later explicit purge and never move destructively. Do not treat old desktop/device credentials as valid static Agent secrets; public-backend Agent secrets are configured explicitly through the new environment workflow.

### Remove desktop UI instead of recreating it locally

The product shell, theme/window chrome, desktop management views, and desktop-only Douban panel are retired. Management and profile controls map to the deployed Web application through the local bridge; environment selection maps to tray/CLI; diagnostics map to Web/tray/CLI; browser hosting maps to the Agent runtime; packaging maps to Agent artifacts. The Agent continues serving JSON APIs only.

### Delete by verified dependency reachability

Remove `apps/desktop`, Electron configuration, desktop workflows, and dependencies reachable only from that app. Run repository searches and package-graph checks before deleting `packages/app-shell`, `packages/ui`, theme assets, or shared protocol code. Shared packages with remaining Web consumers stay.

### Make terminology and support paths unambiguous

Documentation and CLI output use CthuAgent/local Agent for the installed component and CthuTool Web for the deployed UI. Existing CthuDesktop docs are removed or redirected to `chc agent install`, tray environment/Open CthuTool actions, CLI diagnostics, and migration guidance. Release channels stop publishing Electron artifacts after cutover.

## Risks / Trade-offs

- [Legacy environment cannot be resolved] -> Require explicit catalog selection; never guess a public endpoint or profile namespace.
- [Legacy profile migration fails] -> Copy non-destructively, validate content/ownership, keep originals, and expose retry/doctor output.
- [A hidden desktop dependency is deleted] -> Use package graph, `rg`, targeted validation, and supported-platform smoke tests before removal.
- [Users lose a desktop-only workflow] -> Publish the intentional removal list and verify a Web replacement where promised.
- [Rollback is needed] -> Keep the last supported Electron artifact and original data for a bounded rollback window.

## Migration Plan

1. Confirm all six predecessor changes are applied, archived/synced in order, and pass parity/release gates.
2. Ship explicit environment resolution and non-destructive profile migration through Agent/CLI while Electron remains available.
3. Stop publishing Electron as default and make `chc agent install` plus the deployed Web application the supported path.
4. Remove `apps/desktop`, its tests/config/workflow, Electron-only dependencies, and retired docs/spec requirements.
5. Run full repository validation plus clean supported-platform install, environment/auth, Web bridge, browser-control, exit, and uninstall tests.
6. Roll back using the last Electron artifact and retained legacy paths; do not reverse-delete migrated Agent data.

## Open Questions

- Define the bounded rollback/support window for the last Electron release before implementation.
- Inventory whether the desktop Douban lookup has a confirmed Web replacement; otherwise document intentional removal.
