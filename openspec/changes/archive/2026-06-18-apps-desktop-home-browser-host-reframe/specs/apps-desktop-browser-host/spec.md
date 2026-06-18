## ADDED Requirements

### Requirement: Browser Host management workspace
CthuDesktop SHALL provide a Browser Host workspace for managing the current host machine's browser capability.

#### Scenario: Browser Host workspace is available
- **WHEN** the desktop renderer shell is loaded
- **THEN** the activity bar includes a Browser Host workspace entry for local browser capability management

#### Scenario: Browser runtime readiness is visible
- **WHEN** the user opens Browser Host
- **THEN** the page shows whether the configured browser runtime is ready, pending, or unavailable using the local runtime diagnostic

#### Scenario: Managed profiles are visible
- **WHEN** backend browser profile summaries are available
- **THEN** Browser Host shows managed site profiles, profile names, verification state, and public account metadata when available

#### Scenario: Browser actions stay explicit
- **WHEN** Browser Host shows a required-auth site
- **THEN** login, verification, and clear-profile actions remain explicit user actions and do not run automatically

## MODIFIED Requirements

### Requirement: Pending auth task UI
CthuDesktop SHALL display pending browser-auth attention generated from local preflight, backend requests, or runtime failures without requiring a separate top-level Tasks workspace.

#### Scenario: Local preflight finds missing required profile
- **WHEN** CthuDesktop loads backend site configuration and a required site has no verified local profile
- **THEN** it displays browser-auth attention for that site profile in Home and Browser Host

#### Scenario: Backend requests missing auth
- **WHEN** the backend sends or exposes a pending auth task for a required profile
- **THEN** CthuDesktop displays or updates the matching browser-auth attention without creating duplicates

#### Scenario: Runtime failure expires profile
- **WHEN** browser access with a verified profile reaches a login page or receives an expired-auth detection
- **THEN** CthuDesktop marks the profile `expired`, stops using it for required tasks, and displays re-login browser-auth attention

#### Scenario: Browser-auth attention resolves from Browser Host
- **WHEN** the user resolves browser-auth attention by opening login, verifying, or clearing a profile from Browser Host
- **THEN** CthuDesktop refreshes backend and local browser state and updates Home and Browser Host attention state

### Requirement: Douban login status display
CthuDesktop SHALL display Douban login status in its Browser Host UI using public profile summaries and pending auth tasks.

#### Scenario: Douban verified account is shown
- **WHEN** the browser status data contains a verified `douban` profile with a display name
- **THEN** the Browser Host UI shows Douban as verified and displays the account display name

#### Scenario: Douban user id is shown when available
- **WHEN** the browser status data contains a verified `douban` profile with an external user id
- **THEN** the Browser Host UI displays that external user id with the Douban account status

#### Scenario: Douban pending login is shown
- **WHEN** no verified `douban` profile exists and a pending auth task exists for the Douban profile
- **THEN** the Browser Host UI shows that Douban requires login and displays the pending reason

#### Scenario: Douban status uses public state only
- **WHEN** the Browser Host UI renders Douban login status
- **THEN** it uses public profile summaries and pending auth task summaries without reading cookies, localStorage, storage-state contents, or local profile directory internals
