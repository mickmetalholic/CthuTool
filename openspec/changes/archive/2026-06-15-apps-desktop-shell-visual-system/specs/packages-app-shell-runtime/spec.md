## ADDED Requirements

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
