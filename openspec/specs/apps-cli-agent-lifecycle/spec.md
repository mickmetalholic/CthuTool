# apps-cli-agent-lifecycle Specification

## Purpose
TBD - created by archiving change add-cli-agent-lifecycle. Update Purpose after archive.
## Requirements
### Requirement: Agent lifecycle and environment command group
The CLI SHALL expose `chc agent` as a public static group containing install,
start, stop, restart, status, settings, logs, doctor, update, uninstall,
autostart enable/disable, and env list/get/set commands.

#### Scenario: Bare Agent group is invoked
- **WHEN** a user runs `chc agent` without a subcommand
- **THEN** the CLI renders help listing every supported subcommand

#### Scenario: Command discovery is checked
- **WHEN** help, completion, and registry invariants run
- **THEN** every public subcommand is discoverable through the existing static
  command system and no secret configuration command is registered

### Requirement: Verified user-scoped installation
`chc agent install` SHALL install a compatible verified Agent release and trusted environment catalog to user-scoped versioned paths without administrator privileges.

#### Scenario: Installation succeeds
- **WHEN** the manifest, archive, and catalog have valid signatures/digests and pass compatibility/layout checks
- **THEN** the CLI stages the version, switches the active pointer atomically, and reports installed version and paths

#### Scenario: Verification fails
- **WHEN** integrity, catalog endpoint/schema, platform, safe-extraction, or compatibility validation fails
- **THEN** installation stops before activation and preserves the prior active version

### Requirement: Safe environment configuration
The CLI SHALL list verified catalog environments and report or change the one
active environment without accepting or storing a static Agent secret.

#### Scenario: Environments are listed
- **WHEN** the user runs `chc agent env list`
- **THEN** output identifies catalog environments and the active one without
  reporting a secret-configured state

#### Scenario: Environment is selected while running
- **WHEN** the user runs `chc agent env set <id>` for another valid environment
- **THEN** the CLI invokes the Agent's complete environment-switch contract and
  reports the resulting authoritative environment

#### Scenario: Environment is selected while stopped
- **WHEN** no Agent is running and a valid catalog environment is selected
- **THEN** the CLI persists it as the environment used on the next start

### Requirement: Exact tray and Agent lifecycle control
Start, stop, restart, and status SHALL identify the authoritative tray/Agent through protected same-user IPC and executable, PID, nonce, endpoint, and version validation rather than process-name matching.

#### Scenario: Installed Agent starts
- **WHEN** start runs and no valid instance is active
- **THEN** the CLI starts the active tray entry point and waits for bounded tray-Agent readiness

#### Scenario: Agent is already running
- **WHEN** start finds a compatible healthy authoritative instance
- **THEN** it succeeds idempotently without spawning a duplicate

#### Scenario: Agent stops
- **WHEN** the user runs `chc agent stop`
- **THEN** the CLI invokes the same coordinated shutdown as tray Exit and confirms both processes have exited

#### Scenario: Instance record points elsewhere
- **WHEN** process, executable, nonce, endpoint, same-user, or protocol validation does not match
- **THEN** the CLI does not signal that process and safely reports or repairs stale metadata

### Requirement: Redacted Agent status
`chc agent status` SHALL distinguish installation, active version, tray/process
health, active environment, backend connectivity, autostart, and browser
readiness without exposing or checking a static Agent secret.

#### Scenario: Human status is requested
- **WHEN** status runs without `--json`
- **THEN** it prints a concise actionable summary and stable result for running,
  stopped, degraded, or not-installed state

#### Scenario: JSON status is requested
- **WHEN** status runs with `--json`
- **THEN** it returns a versioned object without authorization material, bridge
  tickets/tokens, or raw profile data

### Requirement: Deployed Web and logs access
The CLI SHALL open the active environment's deployed Web application through a one-time local-bridge bootstrap and locate redacted Agent logs.

#### Scenario: Settings command runs
- **WHEN** a healthy Agent receives `chc agent settings`
- **THEN** the CLI opens the exact configured same-origin Agent-console URL with endpoint, ticket, and environment in the fragment

#### Scenario: Settings runs while stopped
- **WHEN** the Agent is installed but not running
- **THEN** the CLI starts the tray, waits for readiness, and opens a fresh single-use launch URL

#### Scenario: Logs command runs
- **WHEN** the user invokes `chc agent logs`
- **THEN** it shows or follows the redacted Agent-owned log source according to options

### Requirement: User-session autostart
The CLI SHALL manage idempotent per-user autostart for the authoritative tray entry point through platform adapters.

#### Scenario: Autostart is enabled
- **WHEN** `chc agent autostart enable` runs
- **THEN** the CLI creates or updates per-user startup registration for the active tray launcher

#### Scenario: Autostart is disabled
- **WHEN** `chc agent autostart disable` runs
- **THEN** the CLI removes only the managed registration and leaves a currently running Agent unchanged

### Requirement: Verified Agent update and rollback
`chc agent update` SHALL update only the local Agent, atomically activate a verified compatible version/catalog, health-check it, and restore the prior version on failed startup.

#### Scenario: Update succeeds
- **WHEN** a newer compatible signed version is available
- **THEN** the CLI stages it, coordinates shutdown, switches, starts it, verifies readiness/catalog, and retains the prior version for bounded rollback

#### Scenario: New version fails readiness
- **WHEN** the activated Agent does not become healthy within the bound
- **THEN** the CLI stops it, restores and restarts the previous version, and reports rollback

#### Scenario: CLI self-update is intended
- **WHEN** a user runs `chc update`
- **THEN** existing CLI update behavior remains separate from `chc agent update`

### Requirement: Agent doctor diagnostics
`chc agent doctor` SHALL run bounded redacted checks for install/release/catalog
integrity, active version/environment, autostart, instance identity, local
control, backend/Web origin, Chrome, profile locks, and logs.

#### Scenario: Doctor finds a problem
- **WHEN** one or more checks fail
- **THEN** output identifies categories, remediation, and a stable code without
  any authorization value

#### Scenario: JSON doctor is requested
- **WHEN** doctor runs with `--json`
- **THEN** it returns versioned per-check status suitable for automation

### Requirement: Data-preserving uninstall
`chc agent uninstall` SHALL stop the managed instance, remove managed
autostart and immutable versions, and preserve environment selection, profiles,
and logs by default.

#### Scenario: Default uninstall runs
- **WHEN** the user uninstalls without `--purge`
- **THEN** binaries/startup registration are removed while mutable data remains
  and its location is reported

#### Scenario: Purge is confirmed
- **WHEN** the user explicitly requests and confirms `--purge`
- **THEN** the CLI removes documented mutable categories after stopping the
  Agent and reports each category

#### Scenario: Purge is not confirmed
- **WHEN** destructive purge lacks required interactive or automation
  confirmation
- **THEN** the CLI aborts deletion and preserves mutable data
