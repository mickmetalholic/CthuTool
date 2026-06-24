## MODIFIED Requirements

### Requirement: Browser Host management workspace
CthuDesktop SHALL provide a Browser Host workspace for managing the current host machine's browser capability with scannable runtime, attention, profile, and action-feedback sections.

#### Scenario: Browser Host workspace is available
- **WHEN** the desktop renderer shell is loaded
- **THEN** the activity bar includes a Browser Host workspace entry for local browser capability management

#### Scenario: Runtime readiness is the first page signal
- **WHEN** the user opens Browser Host
- **THEN** the page shows the configured browser runtime status, diagnostic message, and whether the host browser capability is ready before listing managed profiles

#### Scenario: Managed profiles are grouped for scanning
- **WHEN** backend browser profile summaries are available
- **THEN** Browser Host shows managed site profiles with site name, profile name, verification state, public account metadata, and required action availability in a row or section optimized for repeated scanning

#### Scenario: Browser actions stay explicit
- **WHEN** Browser Host shows a required-auth site
- **THEN** login, verification, and clear-profile actions remain explicit user actions and do not run automatically

#### Scenario: Action feedback is associated with the affected profile
- **WHEN** the user opens login, verifies, or clears a site profile from Browser Host
- **THEN** Browser Host shows running, success, or error feedback next to the affected site/profile while preserving page-level recovery feedback for unexpected failures

#### Scenario: Browser status loading is visible
- **WHEN** Browser Host is refreshing backend browser status
- **THEN** the page indicates that browser status is loading without hiding existing local pending-auth attention

#### Scenario: Backend browser status failure is recoverable
- **WHEN** Browser Host cannot load backend browser status
- **THEN** the page shows a recoverable error and keeps local browser-auth attention visible when local pending-auth state is available

### Requirement: Pending auth task UI
CthuDesktop SHALL display pending browser-auth attention generated from local preflight, backend requests, or runtime failures in Home and Browser Host without requiring a separate top-level Tasks workspace.

#### Scenario: Local preflight finds missing required profile
- **WHEN** CthuDesktop loads backend site configuration and a required site has no verified local profile
- **THEN** it displays browser-auth attention for that site profile in Home and Browser Host

#### Scenario: Backend requests missing auth
- **WHEN** the backend sends or exposes a pending auth task for a required profile
- **THEN** CthuDesktop displays or updates the matching browser-auth attention without creating duplicates

#### Scenario: Runtime failure expires profile
- **WHEN** browser access with a verified profile reaches a login page or receives an expired-auth detection
- **THEN** CthuDesktop marks the profile `expired`, stops using it for required tasks, and displays re-login browser-auth attention

#### Scenario: Browser-auth attention is summarized on Browser Host
- **WHEN** Browser Host has one or more pending browser-auth attention items
- **THEN** the page shows an attention summary with affected site/profile names, reason, source, and available next actions

#### Scenario: Browser-auth attention has an empty state
- **WHEN** Browser Host has no pending browser-auth attention
- **THEN** the page shows a concise ready state instead of a blank task or attention area

#### Scenario: Browser-auth attention resolves from Browser Host
- **WHEN** the user resolves browser-auth attention by opening login, verifying, or clearing a profile from Browser Host
- **THEN** CthuDesktop refreshes backend and local browser state and updates Home and Browser Host attention state
