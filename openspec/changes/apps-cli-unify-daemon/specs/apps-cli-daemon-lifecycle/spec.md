## Purpose

Define the canonical CLI interface for configuring and operating one user-owned browser daemon, including local browser Profiles and safe takeover of existing Agent data.

## ADDED Requirements

### Requirement: Canonical daemon command group
The CLI SHALL expose `chc daemon` with setup, config show/set, start, stop, restart, status, logs, doctor, profile list/login/verify/remove, and autostart enable/disable/status operations. It SHALL remove `chc agent` from the supported command surface and SHALL NOT expose separate daemon install, update, uninstall, environment-selection, or Web-console launch commands.

#### Scenario: Commands are discovered
- **WHEN** a user requests daemon help or shell completion
- **THEN** the supported operations are discoverable under `chc daemon` and the bare group prints help
- **AND** the retired Agent operations are absent

#### Scenario: Old command is invoked
- **WHEN** a user invokes `chc agent`
- **THEN** it does not start a tray or install an Agent bundle and returns an actionable migration message naming `chc daemon`

### Requirement: Explicit terminal setup
`chc daemon setup` SHALL accept a deployment Origin and optional device name, browser executable path, and connection toggle through terminal interaction or explicit arguments. It SHALL validate an exact HTTPS Origin, with an explicit non-production loopback exception, and SHALL NOT require a native UI, Web page, or static Agent Secret.

#### Scenario: Initial setup succeeds
- **WHEN** valid configuration is supplied interactively or through complete arguments
- **THEN** setup saves user-scoped configuration atomically without starting a tray or implicitly registering autostart

#### Scenario: Non-interactive input is incomplete
- **WHEN** required setup input is absent in non-interactive mode
- **THEN** setup returns a stable non-zero missing-input error without prompting or changing configuration

### Requirement: Single-writer configuration changes
Configuration mutations SHALL have one authoritative writer: the running daemon through protected local control, or the CLI while holding an exclusive configuration lock when no daemon owns it. Unsupported keys SHALL be rejected; a rejected candidate SHALL leave known-good configuration unchanged.

#### Scenario: Running deployment Origin changes
- **WHEN** a configured daemon receives a valid candidate Origin with connections enabled
- **THEN** it verifies the candidate with a transient identity before committing it and coordinates old work cleanup and reconnect
- **AND** failed verification preserves the prior configuration and connection

#### Scenario: Stopped daemon is configured offline
- **WHEN** no daemon is running and schema-valid setup/configuration is supplied
- **THEN** the CLI can save it without requiring Backend availability and reports that connectivity is unverified

#### Scenario: Configuration races startup
- **WHEN** startup and configuration mutation contend for ownership
- **THEN** only one writer commits a configuration revision and neither operation overwrites the other's completed change

### Requirement: Foreground and background execution
`chc daemon start` SHALL start one background daemon and return after bounded local readiness; `--foreground` SHALL run the same runtime in the current process until shutdown. A missing deployment configuration SHALL fail with setup remediation rather than leaving an idle restart loop.

#### Scenario: Backend is offline
- **WHEN** valid local configuration exists but Backend connection fails
- **THEN** startup succeeds once local control is ready and separately reports Backend offline/reconnecting

#### Scenario: Healthy daemon already exists
- **WHEN** background start finds the authoritative compatible instance
- **THEN** it succeeds idempotently without opening duplicate browser resources

#### Scenario: Foreground run is interrupted
- **WHEN** a supported termination signal or local shutdown request reaches the foreground daemon
- **THEN** it performs the same bounded browser cleanup and lock release as background stop

### Requirement: Exact process ownership and shutdown
Lifecycle commands SHALL validate user scope, PID/process start identity, executable and entrypoint, instance nonce, and control protocol before controlling a daemon. Stop SHALL reject new work, drain or cancel bounded work, close owned browser resources, and confirm exit; forced termination SHALL be limited to a revalidated owned process.

#### Scenario: Stale or reused PID is recorded
- **WHEN** recorded identity does not match the live process
- **THEN** lifecycle commands do not signal that process and report or safely recover stale metadata

#### Scenario: Stop is repeated
- **WHEN** the daemon is already stopped
- **THEN** stop succeeds without deleting configuration or Profiles

### Requirement: Read-only local status and diagnostics
Status, doctor, config show, and log-reading operations SHALL remain usable without Backend access and SHALL NOT migrate data, alter configuration, start a daemon, or repair service registration implicitly. Status SHALL distinguish configuration, process, Backend, browser, build identity, and service-registration facts.

#### Scenario: Status precedes setup
- **WHEN** status runs without valid configuration
- **THEN** it reports setup required and the setup command without writing defaults

#### Scenario: Status is requested as JSON
- **WHEN** a finite management operation supports and receives `--json`
- **THEN** stdout contains one versioned result or stable error object without credentials, cookies, instance nonces, or raw Profile data

#### Scenario: Logs are followed
- **WHEN** logs runs with `--follow`
- **THEN** it streams bounded redacted events until interrupted and releases its watch resources on exit

### Requirement: Daemon-owned local Profile management
Profile operations SHALL address a site and Profile name through protected local control, share browser ownership and execution ordering with Backend work, and keep raw browser storage on the daemon host. Mutations SHALL require a running daemon; an unavailable daemon SHALL produce actionable start remediation.

#### Scenario: Profile login is opened
- **WHEN** profile login receives a supported login URL in a usable graphical user session
- **THEN** the daemon opens an owned visible browser using that Profile and returns while preserving the login window after the CLI command exits

#### Scenario: Login has no graphical session
- **WHEN** visible login is requested on a headless host session
- **THEN** the command reports the missing graphical-session prerequisite without claiming login succeeded

#### Scenario: Profile is verified
- **WHEN** profile verify receives a supported verification URL
- **THEN** it verifies and persists bounded Profile status through the same browser runtime used by Backend commands

#### Scenario: Profile removal is attempted
- **WHEN** removal is confirmed for an unlocked Profile
- **THEN** only that Profile is removed
- **AND** an occupied Profile or missing confirmation is rejected without deleting browser data

### Requirement: Identity-preserving legacy takeover
Setup/start SHALL detect the exact legacy tray/Agent and startup registrations that own the selected data root before activating the daemon. Takeover SHALL preserve existing device identity, configuration, Profiles, logs, and ignored legacy secrets, and SHALL fail safely when ownership or data selection is ambiguous.

#### Scenario: Existing self-use Agent is migrated
- **WHEN** setup/start takes over a verified same-user legacy installation
- **THEN** it coordinates legacy shutdown, removes only its competing startup registration, and preserves the data root for daemon use
- **AND** the daemon starts only when start is explicitly requested; setup alone does not launch it
- **AND** it does not delete historical version archives or unrelated process/service records

#### Scenario: Legacy ownership cannot be established
- **WHEN** a legacy record cannot be safely matched or multiple data namespaces require a selection
- **THEN** takeover stops with explicit remediation and leaves existing processes and browser data intact
