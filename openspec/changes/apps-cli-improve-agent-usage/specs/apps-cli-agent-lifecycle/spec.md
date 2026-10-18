## MODIFIED Requirements

### Requirement: Deployed Web and logs access
The CLI SHALL open the native Agent Settings window for configuration and locate redacted Agent logs. The deployed Web console SHALL remain accessible through the separate Open Web Console action in native settings using a fresh one-time local-bridge launch.

#### Scenario: Settings command runs
- **WHEN** a healthy tray receives `chc agent settings`
- **THEN** the CLI opens or foregrounds native Agent Settings through authenticated same-user control
- **AND** it does not open the Web console as the configuration entry point

#### Scenario: Settings runs while stopped
- **WHEN** the Agent is installed but its tray is not running
- **THEN** the CLI starts the tray, waits for readiness, and opens native first-run or settings mode

#### Scenario: Logs command runs
- **WHEN** the user invokes `chc agent logs`
- **THEN** it shows or follows the redacted Agent-owned log source according to options
