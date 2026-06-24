## ADDED Requirements

### Requirement: Settings section ownership
CthuDesktop SHALL organize Settings sections by information ownership and editability so configuration, local runtime facts, diagnostics, logs, and appearance readiness are not mixed into one page.

#### Scenario: Service section owns editable connection configuration
- **WHEN** the user opens the Settings service section
- **THEN** editable environment, backend URL, device name, and local agent enabled controls are available there and not duplicated as editable controls on Home or read-only diagnostics pages

#### Scenario: Local runtime section owns host facts
- **WHEN** the user opens the Settings local runtime or status section
- **THEN** read-only local app metadata, platform, packaged state, agent identity, browser runtime kind, browser runtime status, and local filesystem paths are grouped for scanning

#### Scenario: Diagnostics section owns troubleshooting detail
- **WHEN** the user opens the Settings diagnostics section
- **THEN** recent connection error, registration timing, backend URL, active environment, browser runtime diagnostic message, and other troubleshooting details are available without exposing unrelated edit controls

#### Scenario: Appearance section does not imply unfinished theme switching
- **WHEN** the Settings appearance section is shown before full theme switching exists
- **THEN** it presents the current fixed theme or token-system state without exposing controls that appear executable but are not supported

## MODIFIED Requirements

### Requirement: Settings workspace
The desktop application SHALL provide a bottom-left Settings entry that switches to an app configuration and diagnostics workspace with clear section ownership.

#### Scenario: Settings entry switches workspace
- **WHEN** the user activates the bottom-left Settings entry
- **THEN** the application switches from the main workspace to the Settings workspace

#### Scenario: Settings sections are organized by submenu
- **WHEN** the Settings workspace is active
- **THEN** it provides submenu sections for service connection, local runtime or status, diagnostics, logs, and appearance readiness without mixing editable configuration and read-only diagnostic data on the same page

#### Scenario: Service configuration is not mixed into business home
- **WHEN** the user views the default main workspace
- **THEN** backend URL and environment editing controls are not the primary content of that workspace

#### Scenario: Logs remains a placeholder section
- **WHEN** the user opens Settings Logs before a log system exists
- **THEN** the page clearly states that log viewing is not connected and does not present synthetic logs as real runtime events

### Requirement: Runtime status surfaces
The desktop application SHALL expose runtime status in the shell and detailed Settings sections without requiring users to open raw logs.

#### Scenario: Status bar summarizes active connection
- **WHEN** the desktop app is running
- **THEN** the status bar shows the active environment, backend URL, backend connection state, platform, and app version

#### Scenario: Diagnostics view shows connection detail
- **WHEN** the user opens the diagnostics section in Settings
- **THEN** the desktop app shows recent connection errors, selected backend URL, active environment, agent id, last registered time, last heartbeat or last seen information when available, and browser runtime diagnostic detail

#### Scenario: Environment status opens service settings
- **WHEN** the user activates the status bar environment and connection segment
- **THEN** the desktop app opens the Settings workspace focused on the service connection section

#### Scenario: Client status opens local runtime settings
- **WHEN** the user activates the status bar platform and version segment
- **THEN** the desktop app opens the Settings workspace focused on the local runtime or status section

#### Scenario: Logs view is accessible from Settings
- **WHEN** the user opens the logs section in Settings
- **THEN** the desktop app provides an explicit placeholder for future local or server-backed log inspection without mixing logs into the default main workspace or implementing log retrieval in this change
