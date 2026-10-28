## Purpose

Define consistent daemon lifecycle and user-session autostart behavior across macOS, Windows, and Linux while exposing platform-specific service availability and recovery policies.

## ADDED Requirements

### Requirement: Three-platform user-session support
Daemon foreground and ordinary background execution SHALL support macOS, Windows, and Linux under the current operating-system user without an application tray, a privileged machine-wide service, or a second custom supervisor process.

#### Scenario: Daemon runs on each supported OS
- **WHEN** compatible Node and host Chrome prerequisites exist on macOS, Windows, or Linux
- **THEN** the same public daemon command surface can start, inspect, and stop local browser execution

### Requirement: Native user-service adapters
Autostart SHALL use a current-user LaunchAgent on macOS, an interactive-current-user scheduled task on Windows, and a systemd user unit on Linux. Managed launch SHALL invoke the installed daemon foreground path using resolved executable/entrypoint paths rather than depending on an interactive shell's `PATH` or working directory.

#### Scenario: Registration is enabled
- **WHEN** autostart enable runs with a supported user service manager
- **THEN** it idempotently registers the current installed daemon entrypoint for the current user and reports its service manager and launch identity

#### Scenario: Windows performs interactive login
- **WHEN** the managed Windows daemon receives a login request while the user is logged in
- **THEN** its registration permits opening the owned browser in that user's interactive session without persisting a user password

### Requirement: Managed and unmanaged lifecycle ownership
Start, stop, and restart SHALL select the authoritative launch mode and SHALL NOT leave a detached daemon competing with a registered service instance. Enabling/disabling autostart SHALL change future registration without silently replacing a healthy running instance; a later explicit restart SHALL coordinate any mode handover.

#### Scenario: Managed daemon is stopped
- **WHEN** a user invokes daemon stop for a service-managed daemon
- **THEN** the service adapter and daemon coordinate clean shutdown without immediate automatic resurrection
- **AND** future-login registration remains enabled until explicitly disabled

#### Scenario: Autostart is disabled during a run
- **WHEN** autostart disable runs while the daemon is healthy
- **THEN** only the owned future-start registration is removed and the running daemon remains available

#### Scenario: Launch mode changes
- **WHEN** explicit restart follows a registration-mode change
- **THEN** the existing owned instance exits before the replacement starts and both modes use the same instance/Profile locks

### Requirement: Observable platform recovery policy
Managed execution SHALL use platform-native throttling or finite failure retries and SHALL expose its effective recovery policy. Clean operator shutdown, Backend disconnection, and unavailable Chrome SHALL NOT be treated as unexpected daemon-process crashes; unmanaged execution SHALL report that it has no automatic process recovery.

#### Scenario: Managed process fails unexpectedly
- **WHEN** a managed daemon exits abnormally
- **THEN** the native manager applies its configured failure recovery policy without a tight custom restart loop
- **AND** status/doctor can identify the manager and policy without promising identical retry timing across platforms

#### Scenario: Backend connection is lost
- **WHEN** the daemon remains locally healthy but its WSS connection closes
- **THEN** connection retry remains inside the daemon and the service manager does not replace the process

### Requirement: Service-manager fallback
Linux installations without a usable systemd user session and other unavailable registration environments SHALL retain foreground/unmanaged background operation and SHALL return an explicit unsupported/unavailable registration result rather than installing a privileged fallback or pretending autostart is enabled.

#### Scenario: Linux user service manager is unavailable
- **WHEN** autostart is requested without a usable systemd user manager
- **THEN** the CLI reports service unavailability and foreground/background commands remain usable

### Requirement: Safe registration refresh
Update and doctor SHALL detect stale Node/CLI paths in owned registrations. Actual update SHALL refresh only the registration belonging to the updated installation; diagnostics SHALL report stale registration without changing it.

#### Scenario: CLI installation path changes
- **WHEN** a successful actual update changes the managed daemon entrypoint
- **THEN** only that installation's owned service registration is refreshed before managed restart
- **AND** another installation's registration is not overwritten
