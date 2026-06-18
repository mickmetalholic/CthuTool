## ADDED Requirements

### Requirement: Home readiness dashboard
CthuDesktop SHALL use the Home workspace as a local readiness dashboard for the current host.

#### Scenario: Home summarizes connection readiness
- **WHEN** the user opens the Home workspace
- **THEN** Home shows the active environment, backend connection state, and whether the local agent is enabled or connected without exposing backend URL editing controls

#### Scenario: Home summarizes local agent readiness
- **WHEN** the user opens the Home workspace
- **THEN** Home shows the local desktop agent identity or display name and whether the agent is advertising host browser capability

#### Scenario: Home summarizes browser attention
- **WHEN** local or backend browser status includes pending browser-auth attention
- **THEN** Home shows that browser attention exists and directs the user to the Browser Host workspace for resolution

#### Scenario: Home excludes business lookup tools
- **WHEN** the Home workspace renders
- **THEN** it does not show Douban Movie lookup or other business-tool forms

### Requirement: Logs placeholder remains explicit
CthuDesktop SHALL keep the Settings Logs section as an explicit placeholder until a real local or server-backed log capability exists.

#### Scenario: Logs capability is not connected
- **WHEN** the user opens Settings Logs before a log API exists
- **THEN** the page clearly indicates that log viewing is not connected yet rather than showing synthetic runtime events as if they were real logs

## MODIFIED Requirements

### Requirement: Business-first main workspace
The desktop application SHALL default to a main workspace intended for local host capabilities and future business capabilities rather than app configuration.

#### Scenario: Default launch opens main workspace
- **WHEN** the desktop application starts without a saved workspace preference
- **THEN** it opens the main workspace instead of the Settings workspace

#### Scenario: Main business navigation is not duplicated
- **WHEN** the main workspace is active
- **THEN** Home, Browser Host, Agents, and future top-level business capabilities are selected directly from the activity bar without repeating the same destinations in a text submenu

#### Scenario: Tasks is not a primary workspace
- **WHEN** the main workspace is active
- **THEN** the activity bar does not include a first-class Tasks workspace entry for the current browser-auth-only task model

#### Scenario: Future capability slots are visible without enabling behavior
- **WHEN** future capability entries are shown before implementation
- **THEN** the UI presents them as unavailable or placeholder navigation without exposing executable browser-control behavior

### Requirement: Standard desktop page frame
The desktop renderer SHALL render each workspace page through a standard page frame that defines header, optional description, toolbar slot, content spacing, scroll behavior, and responsive overflow handling.

#### Scenario: Pages share a predictable header structure
- **WHEN** the user opens Home, Browser Host, Agents, or a Settings section
- **THEN** the page presents title, context label, and optional actions in consistent locations

#### Scenario: Content spacing does not shift by page
- **WHEN** the user switches between primary desktop pages
- **THEN** page margins, section gaps, and scroll containers remain consistent enough that the shell does not visually jump

#### Scenario: Long metadata remains scannable
- **WHEN** the page displays long backend URLs, agent IDs, local paths, or profile names
- **THEN** those values wrap, truncate, or use metadata styling without overlapping adjacent controls
