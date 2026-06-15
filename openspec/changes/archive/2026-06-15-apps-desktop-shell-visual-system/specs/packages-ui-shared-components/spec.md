## ADDED Requirements

### Requirement: Replaceable neon design tokens
The shared UI package SHALL expose replaceable design tokens for the retro-futuristic dark neon visual direction instead of baking theme colors directly into component implementations.

#### Scenario: Neon palette maps through semantic tokens
- **WHEN** shared components render shell, workspace, panel, repeated item, border, text, accent, glow, and status colors
- **THEN** they read semantic tokens that can be remapped by a future theme without editing component source

#### Scenario: Existing theme configuration can be removed without losing token structure
- **WHEN** the desktop app removes or simplifies its current theme configuration UI
- **THEN** shared tokens still preserve explicit mappings for the active visual theme and future replacement themes

#### Scenario: Glow and CRT-style effects remain tokenized
- **WHEN** components use neon glow, scanline, grid, or depth effects
- **THEN** intensity, opacity, border, and shadow values are represented by reusable tokens or utilities rather than one-off page styles

### Requirement: Shared control primitives for desktop shell
The shared UI package SHALL provide reusable control primitives needed by the desktop shell visual-system refresh, including icon buttons, status badges, page toolbar controls, and notice surfaces.

#### Scenario: Icon buttons expose accessible names
- **WHEN** a shell, toolbar, or inline action uses an icon-only button
- **THEN** the shared primitive requires or preserves an accessible name and visible focus state

#### Scenario: Status badges use semantic variants
- **WHEN** a page or shell displays connected, pending, running, warning, error, success, or disabled state
- **THEN** shared status badge variants use semantic tokens rather than page-local color rules

#### Scenario: Notice surfaces communicate severity
- **WHEN** a page renders empty, info, warning, or error messages
- **THEN** shared notice surfaces distinguish severity with consistent semantics and accessible text structure

### Requirement: Shared layout primitives for scan-friendly pages
The shared UI package SHALL provide layout primitives that support dense desktop pages without nested-card visual clutter.

#### Scenario: Metric tiles use stable dimensions
- **WHEN** metric or summary tiles render different values
- **THEN** tile spacing, minimum size, and text wrapping prevent layout jumps and overlapping text

#### Scenario: Repeated surfaces avoid nested-card styling
- **WHEN** shared page sections, repeated list items, tables, or status lists are rendered
- **THEN** the primitives distinguish surfaces and repeated items without requiring floating cards inside cards

### Requirement: Token coverage for shell and page states
The shared UI package SHALL expose semantic tokens for shell and page state styling beyond generic button/card colors.

#### Scenario: Shell and workspace surfaces use distinct tokens
- **WHEN** desktop shell, workspace background, panels, status bars, and repeated list items are styled
- **THEN** shared tokens provide distinct semantic roles for those surfaces without hard-coded Dracula component colors

#### Scenario: Focus and disabled states are consistent
- **WHEN** shared controls render focused or disabled states
- **THEN** they use consistent ring, opacity, cursor, and text treatment across shell and page contexts
