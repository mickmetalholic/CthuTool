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

### Requirement: Shared page frame composition
The shared app-shell runtime package SHALL provide host-neutral page frame composition for CthuTool pages that need consistent title, description, toolbar, status, and content layout.

#### Scenario: Shared page frame avoids host imports
- **WHEN** the shared page frame is imported by desktop or future web frontend code
- **THEN** it does not import Electron, preload modules, desktop renderer API modules, or `window.cthutoolDesktop`

#### Scenario: Page frame supports optional toolbar actions
- **WHEN** a page has refresh, save, copy, or host-gated actions
- **THEN** the shared page frame provides a stable toolbar slot without requiring each page to reinvent header layout

#### Scenario: Page frame supports atmospheric layers
- **WHEN** a consuming app applies decorative depth, grid, glow, or 3D-inspired background layers
- **THEN** the shared page frame provides safe layering slots or class hooks that keep foreground content readable and interactive

### Requirement: Shared status and notice patterns
The shared app-shell runtime package SHALL provide reusable host-neutral patterns for page status, empty states, error notices, metadata rows, metric summaries, and status lists.

#### Scenario: Pages can render empty and error states consistently
- **WHEN** a shared or desktop page has no data or receives an error message
- **THEN** it can render a consistent empty or error state using shared app-shell composition without app-local markup duplication

#### Scenario: Metadata rows handle long values
- **WHEN** shared page code displays URLs, IDs, paths, timestamps, or profile names
- **THEN** metadata rows provide predictable wrapping, truncation, or monospace treatment while staying host-neutral

### Requirement: Shared shell pieces remain capability-aware
Shared app-shell composition SHALL expose capability-aware affordance patterns that desktop can use without leaking host-only powers into web-safe rendering.

#### Scenario: Capability-gated controls have non-executable fallback states
- **WHEN** a shared shell or page component is rendered without a required host capability
- **THEN** the component hides, disables, or replaces the control with a non-executable state

#### Scenario: Capability-aware rendering is testable
- **WHEN** app-shell type tests or renderer tests provide desktop and web-safe runtime adapters
- **THEN** they can assert the presence or absence of host-only affordances without launching Electron
