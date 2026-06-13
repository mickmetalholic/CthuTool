## Why

The first desktop agent console proves the backend connection path, but it still feels like a web settings page inside a native window. CthuDesktop needs a product shell that feels like a real desktop app and can grow into future local capabilities such as Chrome connection, browser workers, task views, and diagnostics.

## What Changes

- Add a custom Electron window shell with frameless native windows, app-owned title bar, draggable regions, and platform-aware window controls.
- Rename the user-facing product surface to `CthuDesktop` and apply a dedicated app icon across Electron packaging and renderer chrome.
- Replace the current single-page console layout with a VS Code-like application shell:
  - A default main workspace for business capabilities.
  - A left activity bar for primary capability groups.
  - No duplicate text submenu in the main workspace; Home, Chrome, and Agents are selected directly from the activity bar.
  - A bottom Settings entry in the activity bar that switches to an app configuration workspace.
  - Settings-only submenus for service connection, local status, diagnostics, logs, and appearance.
  - A status bar with two VS Code-like buttons: an environment/connection button that opens Settings > Service, and a client/platform/version button that opens Settings > Status.
- Add a Dracula-based theme as the first built-in color scheme, with a token structure that can later support more built-in schemes.
- Replace the single persisted backend URL with environment profiles:
  - Local development defaults to a local-only environment using `http://localhost:3000`, still user configurable.
  - Packaged builds expose configurable Test and Production environments.
  - Switching environments reconnects the desktop agent to the selected backend.
- Add Settings views for service connection configuration, local agent status, diagnostics, logs, appearance, and future app-level preferences. Logs live under Settings rather than as a main capability.
- Add GitHub Actions packaging for macOS and Windows desktop artifacts.
- Keep browser control and local Chrome connection as future business capabilities; this change creates their navigation and shell slots but does not implement browser automation behavior.

## Capabilities

### New Capabilities
- `apps-desktop-product-shell`: Defines the CthuDesktop app shell, custom title bar, workspace navigation, Dracula theme, environment profiles, Settings workspace, and runtime status surfaces.
- `apps-desktop-packaging-ci`: Defines desktop icon packaging and GitHub Actions builds for macOS and Windows artifacts.

### Modified Capabilities
- None.

## Impact

- Affects `apps/desktop` Electron main-process window creation, preload IPC surface, renderer layout, renderer styles, local configuration model, and desktop tests.
- Affects desktop packaging metadata and app asset files for icon, product name, and platform targets.
- Adds or updates GitHub Actions workflow coverage for desktop build artifacts.
- Requires a migration path from existing single-URL desktop config to environment profiles.
- Does not change backend agent registry protocol requirements, browser automation APIs, CLI behavior, or business data ownership.
