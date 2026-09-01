# apps-cli-agent-lifecycle Specification

## Purpose
Define CLI commands for installing, configuring, starting, updating, diagnosing, accessing, and safely uninstalling the user-scoped Agent.

## Requirements

### Requirement: Agent lifecycle and environment command group

The CLI SHALL expose `chc agent` as a public static group containing install, start, stop, restart, status, settings, logs, doctor, update, uninstall, and autostart enable/disable commands; self-use configuration SHALL be entered through the native Agent Settings window rather than a release catalog environment selector.

#### Scenario: Bare Agent group is invoked

- **WHEN** a user runs `chc agent` without a subcommand
- **THEN** the CLI renders help listing every supported self-use lifecycle and settings subcommand

#### Scenario: Command discovery is checked

- **WHEN** help, completion, and registry invariants run
- **THEN** every supported lifecycle and native-settings entry point is discoverable through the existing static command system

### Requirement: Verified user-scoped installation

`chc agent install` SHALL install a compatible self-use Agent release and validated non-secret environment catalog to user-scoped versioned paths without administrator privileges. Verification SHALL cover manifest schema/provenance, compatibility, catalog binding, archive size/SHA-256, safe extraction, and layout; cryptographic release or platform signatures are not required in self-use mode.

#### Scenario: Installation succeeds

- **WHEN** the latest self-use manifest, archive, and catalog have valid metadata/digests and pass compatibility/layout checks
- **THEN** the CLI stages the generated version, switches the active pointer atomically, and reports installed version and paths

#### Scenario: Verification fails

- **WHEN** integrity, catalog endpoint/schema, platform, safe-extraction, or compatibility validation fails
- **THEN** installation stops before activation and preserves the prior active version

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

`chc agent status` SHALL distinguish installation, active version, tray/process health, SetupRequired/configured state, backend connectivity, autostart, and browser readiness.

#### Scenario: Human status is requested

- **WHEN** status runs without `--json`
- **THEN** it prints a concise actionable summary and stable result for SetupRequired, running, stopped, degraded, or not-installed state

#### Scenario: Unconfigured status is requested

- **WHEN** status runs before a valid Origin is saved
- **THEN** it reports SetupRequired with an actionable instruction to run `chc agent settings`

#### Scenario: JSON status is requested

- **WHEN** status runs with `--json`
- **THEN** it returns a versioned object containing derived endpoint metadata only as safe non-secret values and no Secret, bridge ticket, bearer token, or raw profile data

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

`chc agent update` SHALL update only the local Agent from the latest self-use manifest, atomically activate a compatible version/catalog after integrity and health checks, and restore the prior version on failed startup. The update path SHALL not depend on a signed version or channel pointer.

#### Scenario: Update succeeds

- **WHEN** a newer generated self-use version is available and its archive, catalog, compatibility, and readiness checks pass
- **THEN** the CLI stages it, coordinates shutdown, switches, starts it, verifies readiness/catalog, and retains the prior version for bounded rollback

#### Scenario: New version fails readiness

- **WHEN** the activated Agent does not become healthy within the bound
- **THEN** the CLI stops it, restores and restarts the previous version, and reports rollback

#### Scenario: Latest release is unavailable

- **WHEN** the latest manifest cannot be fetched or fails validation
- **THEN** the CLI leaves the active Agent and its local version selection unchanged and reports the failed update

#### Scenario: CLI self-update is intended

- **WHEN** a user runs `chc update`
- **THEN** existing CLI update behavior remains separate from `chc agent update`

### Requirement: Agent doctor diagnostics

`chc agent doctor` SHALL run bounded redacted checks for install/release integrity, native setup availability, user deployment configuration, active version, autostart, instance identity, local control, Backend/Web endpoint derivation, Chrome, profile locks, and logs.

#### Scenario: Doctor finds a problem

- **WHEN** one or more checks fail
- **THEN** output identifies categories, remediation, and a stable code without any secret value

#### Scenario: Doctor finds missing configuration

- **WHEN** the user has not configured an Origin
- **THEN** output identifies the missing category and reports the native settings remediation

#### Scenario: JSON doctor is requested

- **WHEN** doctor runs with `--json`
- **THEN** it returns versioned per-check status suitable for automation without catalog-only assumptions or sensitive values

### Requirement: Data-preserving uninstall

`chc agent uninstall` SHALL stop the managed instance, remove managed autostart and immutable versions, and preserve deployment Origin, profiles, logs, and ignored legacy Secret files by default.

#### Scenario: Default uninstall runs

- **WHEN** the user uninstalls without `--purge`
- **THEN** binaries and startup registration are removed while mutable configuration, profiles, logs, and ignored legacy Secret files remain and their location is reported

#### Scenario: Purge is confirmed

- **WHEN** the user explicitly requests and confirms `--purge`
- **THEN** the CLI removes the documented mutable categories after stopping the Agent and reports each category

#### Scenario: Purge is not confirmed

- **WHEN** destructive purge lacks required interactive or automation confirmation
- **THEN** the CLI aborts deletion and preserves mutable data

### Requirement: Native settings and Web console access

The CLI SHALL use the native settings window as the configuration entry point and SHALL retain a separate one-time bridge launch path for the deployed Web console.

#### Scenario: Native settings opens

- **WHEN** the tray is installed or running and the user invokes `chc agent settings`
- **THEN** the CLI opens or foregrounds the native setup/settings window through authenticated same-user control

#### Scenario: Web console is opened from native settings

- **WHEN** the user has a verified deployment configuration and selects Open Web Console
- **THEN** the Agent creates a fresh single-use bridge launch and opens the exact derived `/agent` URL

### Requirement: Native self-use configuration

The CLI SHALL open the native Agent Settings window for first-run setup and subsequent deployment configuration, and SHALL not expose static Agent Secret configuration or accept raw Secret values as command-line arguments.

#### Scenario: Settings runs before configuration

- **WHEN** the user runs `chc agent settings` without a valid deployment Origin
- **THEN** the CLI starts or contacts the tray and opens the native first-run wizard

#### Scenario: Settings runs after configuration

- **WHEN** the user runs `chc agent settings` with a valid deployment configuration
- **THEN** the CLI opens the native settings mode, where the user can view status, update Origin, reconnect, and open the deployed Web console

#### Scenario: Raw Secret argument is attempted

- **WHEN** a user attempts to pass a Secret value through a positional or command-line option
- **THEN** the CLI rejects the invocation without persisting or echoing the value

### Requirement: Single latest self-use release resolution

The CLI SHALL resolve Agent installation and update from the fixed `agent-latest` manifest endpoint and SHALL NOT require channel pointers, channel selection, remote version selection, detached archive signatures, or a pinned release public key.

#### Scenario: Latest manifest is requested

- **WHEN** `chc agent install` or `chc agent update` runs
- **THEN** the CLI fetches the latest self-use manifest from the configured HTTPS `agent-latest` endpoint and selects the current supported target

#### Scenario: Legacy or unsupported release contract is returned

- **WHEN** the fetched manifest is a legacy signed-channel schema or an unknown schema
- **THEN** the CLI rejects it with an actionable unsupported-release error and leaves the active Agent unchanged

#### Scenario: Channel option is supplied

- **WHEN** a user supplies a removed channel-selection option to install or update
- **THEN** the CLI rejects the option and explains that self-use mode has one latest release
