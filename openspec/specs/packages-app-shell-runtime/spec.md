# packages-app-shell-runtime Specification

## Purpose
TBD - created by archiving change apps-desktop-shared-ui-foundation. Update Purpose after archive.
## Requirements
### Requirement: Host-neutral runtime contract
The shared app-shell runtime package SHALL define a runtime contract that describes host capabilities and host actions without depending on Electron.

#### Scenario: Runtime kind is explicit
- **WHEN** shared page code reads runtime context
- **THEN** it can distinguish desktop and web runtime kinds through an explicit typed value

#### Scenario: Host capabilities gate UI affordances
- **WHEN** a shared page considers rendering a host-specific action
- **THEN** it uses declared runtime capabilities rather than checking Electron globals or browser globals directly

### Requirement: Shared page composition
The shared app-shell runtime package SHALL provide host-neutral composition for common CthuTool pages and navigation.

#### Scenario: Navigation metadata is reusable
- **WHEN** desktop or future frontend code renders primary navigation
- **THEN** it can use shared navigation metadata for common destinations such as overview, browser profiles, agents, and settings sections

#### Scenario: Shared pages avoid direct host imports
- **WHEN** a page component is exported from the shared app-shell runtime package
- **THEN** it does not import from Electron main, Electron preload, desktop-only renderer API modules, or `window.cthutoolDesktop`

### Requirement: Environment-specific rendering
Shared pages SHALL render different affordances according to the active runtime capabilities.

#### Scenario: Desktop-only actions are available in desktop runtime
- **WHEN** the desktop runtime provides capabilities for window actions, local browser profile actions, or local app paths
- **THEN** shared pages and shell wrappers may render the corresponding controls through the provided host actions

#### Scenario: Desktop-only actions are hidden or disabled in web runtime
- **WHEN** the web runtime lacks capabilities for window actions, local browser profile actions, or local app paths
- **THEN** shared pages do not expose executable controls for those host-only actions

### Requirement: Web-safe default adapter
The shared app-shell runtime package SHALL provide or support a web-safe adapter shape that exposes only network-backed frontend capabilities.

#### Scenario: Web adapter has no local host powers
- **WHEN** a future pure web frontend uses the shared runtime with a web adapter
- **THEN** local filesystem paths, desktop window controls, and local browser-profile mutation actions are unavailable

#### Scenario: Shared status pages remain useful on web
- **WHEN** host-only capabilities are unavailable
- **THEN** shared pages can still display backend-provided agent, browser site, profile, pending-auth, and connection status data

### Requirement: Testable runtime adapters
The shared app-shell runtime package SHALL make runtime behavior testable without launching Electron or a browser host.

#### Scenario: Tests can stub runtime capabilities
- **WHEN** renderer tests exercise shared pages
- **THEN** they can provide a test adapter with selected capabilities and assert environment-specific rendering

#### Scenario: Missing host actions produce recoverable UI states
- **WHEN** a shared page receives a capability that is unavailable or an action implementation that reports failure
- **THEN** the page presents a recoverable disabled, hidden, or error state rather than crashing
