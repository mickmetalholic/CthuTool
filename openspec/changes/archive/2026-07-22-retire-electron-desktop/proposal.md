## Why

After the headless Agent, public-safe environment routing, deployed-Web local bridge, native tray, release bundles, and CLI lifecycle reach parity, Electron becomes duplicate infrastructure and the largest remaining source of UI/runtime coupling. Removing it completes the service-style migration: one lightweight local Agent controls the machine, while the independently deployed Web application owns the UI.

## What Changes

- **BREAKING** Remove the Electron `apps/desktop` application, renderer, preload bridge, desktop-only product shell, and Electron packaging workflow.
- Migrate supported configuration and browser profiles into environment-scoped Agent data roots before removing legacy startup paths.
- Replace CthuDesktop installation, troubleshooting, and architecture documentation with CthuAgent tray/service, deployed Web, and `chc agent` workflows.
- Remove Electron-only dependencies and shared shell code only when repository usage proves they are no longer consumed elsewhere.
- Add migration and parity gates covering public-backend Agent authentication/operator access, environment switching, local bridge, browser control, diagnostics, startup, shutdown, upgrade, and uninstall.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-desktop-agent-console`: Retire the Electron Agent console in favor of the deployed Web console plus local bridge.
- `apps-desktop-browser-host`: Retire the Electron-owned browser host after browser control and environment-scoped profiles move to the headless Agent.
- `apps-desktop-douban-movie-info`: Retire the desktop-only Douban lookup surface rather than porting it into the tray.
- `apps-desktop-observability`: Retire desktop diagnostics after equivalent Agent diagnostics are available through the deployed Web bridge, tray, and CLI.
- `apps-desktop-packaging-ci`: Retire Electron packaging after UI-free Agent release artifacts become the supported distribution.
- `apps-desktop-product-shell`: Retire the desktop window, settings workspace, theme, and shell interaction requirements.
- `apps-root-engineering-config`: Remove Desktop workflow and coverage contracts while preserving the remaining root CI requirements.
- `apps-agent-runtime`: Remove the temporary Electron compatibility adapter after the standalone Agent becomes the only local runtime.
- `apps-web-project-shell`: Make Web styling ownership independent of the deleted renderer source tree.
- `packages-app-shell-runtime`: Retire the unconsumed shared app-shell package with the Electron product shell.
- `packages-ui-shared-components`: Retire the unconsumed shared UI/theme package with the Electron renderer.

## Impact

- Deletes `apps/desktop`, Electron build configuration/artifacts, desktop CI paths, and obsolete desktop documentation.
- Updates workspace dependencies, Turbo filters, root engineering contracts, shared package consumers, release docs, and environment-aware data migration logic.
- Must be implemented last, after the previous six changes are applied, validated, and proven to cover supported behavior.
