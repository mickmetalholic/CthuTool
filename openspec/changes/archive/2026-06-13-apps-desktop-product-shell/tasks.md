## 1. App Identity and Assets

- [x] 1.1 Decide the repository asset paths for CthuDesktop renderer icon, Windows icon, and macOS icon.
- [x] 1.2 Add or generate CthuDesktop icon assets in the selected formats.
- [x] 1.3 Update desktop package metadata, renderer title, and shell identity text to use CthuDesktop.
- [x] 1.4 Add tests or static checks proving desktop package metadata references the expected icon assets and product name.

## 2. Configuration Model and Migration

- [x] 2.1 Extend desktop configuration types to include environment profiles, active environment id, appearance preference, and window state.
- [x] 2.2 Implement migration from existing single `backendUrl` config into a profile-based config without changing stable agent id.
- [x] 2.3 Add development-build defaults with a configurable Local profile using `http://localhost:3000`.
- [x] 2.4 Add packaged-build defaults with configurable Test and Production profiles.
- [x] 2.5 Update main-process connection logic so active environment changes reconnect the agent client to the selected backend.
- [x] 2.6 Add unit tests for config defaults, migration, active environment switching, and agent id preservation.

## 3. Custom Window Shell

- [x] 3.1 Configure the Electron BrowserWindow for a frameless app-owned shell while preserving context isolation and preload security.
- [x] 3.2 Implement a custom title bar with app icon, CthuDesktop identity, active environment, connection state, and app controls.
- [x] 3.3 Implement platform-aware minimize, maximize or zoom, and close IPC actions.
- [x] 3.4 Add explicit draggable and non-draggable regions so title bar controls remain clickable.
- [x] 3.5 Persist and restore window size, position, and maximized state.
- [x] 3.6 Add unit or integration coverage for window-control IPC and window-state persistence.

## 4. Product Shell Navigation

- [x] 4.1 Refactor the renderer from the current page layout into title bar, activity bar, workspace, and status bar shell regions.
- [x] 4.2 Add main workspace routing that opens by default and hosts business capability groups.
- [x] 4.3 Keep main workspace navigation direct from the activity bar without a duplicate text submenu.
- [x] 4.4 Add future capability placeholders such as local Chrome connection without enabling browser-control behavior.
- [x] 4.5 Move the current agent console content into an appropriate main-workspace or agent subview.
- [x] 4.6 Add renderer tests for default workspace selection, activity bar navigation, non-duplicated main navigation, and placeholder behavior.

## 5. Settings Workspace

- [x] 5.1 Add a bottom-left Settings entry that switches from the main workspace to the Settings workspace.
- [x] 5.2 Add Settings submenus for service connection, local status, logs, diagnostics, and appearance.
- [x] 5.3 Move backend URL and environment editing controls into the service connection Settings section.
- [x] 5.4 Add local agent status and connection diagnostics views using main-process connection state.
- [x] 5.5 Add a logs section with a concrete logs view or explicit placeholder for future local log inspection.
- [x] 5.6 Add renderer tests for Settings entry behavior, service config editing, diagnostics display, logs section availability, and status bar shortcuts into service/status settings.

## 6. Dracula Theme Foundation

- [x] 6.1 Define semantic CSS variables for Dracula shell, workspace, panel, input, button, text, border, accent, warning, error, and status colors.
- [x] 6.2 Replace existing hard-coded renderer colors with semantic theme tokens.
- [x] 6.3 Add appearance config persistence for appearance mode and color scheme.
- [x] 6.4 Add Settings controls for appearance mode and Dracula color scheme selection.
- [x] 6.5 Add tests proving Dracula applies by default and appearance preferences persist across config load/save.

## 7. Desktop Packaging

- [x] 7.1 Update electron-builder configuration for CthuDesktop product name, app id, icon paths, and Windows/macOS targets.
- [x] 7.2 Add package scripts for platform artifact builds that can run in CI.
- [x] 7.3 Document unsigned artifact limitations and how Test/Production backend URLs can be configured for packaged builds.
- [x] 7.4 Run a local desktop build or package smoke check on the current platform.

## 8. GitHub Actions Artifact Workflow

- [x] 8.1 Add a dedicated GitHub Actions workflow for desktop artifact builds.
- [x] 8.2 Configure the workflow matrix for `windows-latest` and `macos-latest`.
- [x] 8.3 Install pnpm, Node, and workspace dependencies consistently with existing CI.
- [x] 8.4 Run desktop typecheck, tests, build, and package steps before artifact upload.
- [x] 8.5 Upload platform artifacts with names that identify CthuDesktop and target platform.
- [x] 8.6 Add or update repository contract tests for the new desktop workflow if existing CI workflow tests require it.

## 9. Verification

- [x] 9.1 Run desktop unit and renderer tests.
- [x] 9.2 Run desktop typecheck and build.
- [x] 9.3 Run focused repository tests affected by workflow or package metadata changes.
- [x] 9.4 Run `openspec validate apps-desktop-product-shell --strict`.
- [x] 9.5 Run `git diff --check`.
