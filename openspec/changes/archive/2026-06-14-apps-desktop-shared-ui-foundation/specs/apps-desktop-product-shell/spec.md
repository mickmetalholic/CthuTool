## ADDED Requirements

### Requirement: Desktop renderer React 19 baseline
The desktop renderer SHALL use the React 19 stable line for its renderer runtime and TypeScript React definitions before adopting the shared UI/runtime foundation.

#### Scenario: Desktop package uses React 19
- **WHEN** the desktop package dependencies are inspected
- **THEN** `react` and `react-dom` target the React 19 stable line

#### Scenario: Desktop TypeScript definitions match React 19
- **WHEN** the desktop package development dependencies are inspected
- **THEN** `@types/react` and `@types/react-dom` target React 19-compatible definitions

#### Scenario: React upgrade preserves renderer behavior
- **WHEN** desktop renderer tests run after the React upgrade
- **THEN** existing shell, settings, agents, and browser-profile behavior remains covered and passing before broader UI migration continues

### Requirement: Desktop renderer consumes shared UI foundation
The desktop renderer SHALL consume shared UI primitives and theme tokens for common interface surfaces once the shared UI package exists.

#### Scenario: Common controls use shared primitives
- **WHEN** the desktop renderer displays common buttons, badges, cards, tables, tabs, tooltips, or status surfaces that exist in the shared UI package
- **THEN** those controls are rendered through shared primitives rather than desktop-local duplicates

#### Scenario: Desktop theme uses shared semantic tokens
- **WHEN** the desktop renderer applies its color scheme
- **THEN** shell and page surfaces use shared semantic theme tokens where available while preserving CthuDesktop's configured appearance mode and color scheme

### Requirement: Desktop renderer uses a desktop host adapter
The desktop renderer SHALL access desktop-only host capabilities through a desktop host adapter instead of embedding preload access inside shared page components.

#### Scenario: Window controls call desktop adapter actions
- **WHEN** the user activates minimize, maximize, or close from the desktop shell
- **THEN** the renderer routes the action through the desktop host adapter backed by the preload API

#### Scenario: Local app info stays desktop-scoped
- **WHEN** the desktop renderer displays app version, platform, user data path, config path, or browser profiles path
- **THEN** those values come from the desktop host adapter and are not required by shared web-safe pages

#### Scenario: Local browser actions stay desktop-scoped
- **WHEN** the desktop renderer opens login, verifies a profile, clears a profile, or reads local pending auth tasks
- **THEN** those actions are provided through desktop runtime capabilities and remain unavailable to web-safe adapters

### Requirement: Shared pages remain web-safe
Desktop pages that are moved into shared runtime packages SHALL remain usable without Electron-specific globals.

#### Scenario: Shared page renders without preload API
- **WHEN** a shared page is rendered with a web-safe or test runtime adapter
- **THEN** it does not require `window.cthutoolDesktop` to exist

#### Scenario: Host-only controls are capability-gated
- **WHEN** a shared page is rendered without a capability for a desktop-only action
- **THEN** the page hides, disables, or replaces that control with a non-executable state

## MODIFIED Requirements

### Requirement: Dracula theme foundation
The desktop renderer SHALL use Dracula as the first built-in color scheme and SHALL implement it through shared semantic theme tokens.

#### Scenario: Dracula is the initial scheme
- **WHEN** the desktop application is launched without an appearance preference
- **THEN** the renderer applies the Dracula color scheme

#### Scenario: Theme tokens drive shell surfaces
- **WHEN** the renderer displays title bar, activity bar, workspace, status bar, panels, inputs, and buttons
- **THEN** those surfaces use semantic theme tokens rather than hard-coded component-specific colors

#### Scenario: Shared theme tokens drive common components
- **WHEN** the renderer displays common controls supplied by the shared UI package
- **THEN** those controls use shared semantic tokens that can also be consumed by a future web frontend

#### Scenario: Appearance preference is persisted
- **WHEN** the user changes the appearance mode or color scheme in Settings
- **THEN** the desktop application persists the preference and reapplies it on the next launch
