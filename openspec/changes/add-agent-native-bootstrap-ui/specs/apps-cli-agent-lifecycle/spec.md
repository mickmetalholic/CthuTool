# apps-cli-agent-lifecycle Specification

## MODIFIED Requirements

### Requirement: Agent lifecycle and environment command group

The CLI SHALL expose `chc agent` as a public static group containing install, start, stop, restart, status, settings, logs, doctor, update, uninstall, and autostart enable/disable commands; self-use configuration SHALL be entered through the native Agent Settings window rather than a release catalog environment selector.

#### Scenario: Bare Agent group is invoked

- **WHEN** a user runs `chc agent` without a subcommand
- **THEN** the CLI renders help listing every supported self-use lifecycle and settings subcommand

#### Scenario: Command discovery is checked

- **WHEN** help, completion, and registry invariants run
- **THEN** every supported lifecycle and native-settings entry point is discoverable through the existing static command system

### Requirement: Verified user-scoped installation

`chc agent install` SHALL install a compatible verified self-use Agent release to user-scoped versioned paths without requiring or activating a deployment catalog; deployment Origin SHALL remain mutable user data.

#### Scenario: Installation succeeds

- **WHEN** the self-use manifest, archive, integrity metadata, native setup assets, compatibility, and layout checks pass
- **THEN** the CLI stages the version, switches the active pointer atomically, preserves any existing user configuration, and reports installed version and paths

#### Scenario: Verification fails

- **WHEN** integrity, platform, safe-extraction, native setup inventory, or compatibility validation fails
- **THEN** installation stops before activation and preserves the prior active version and mutable configuration

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

### Requirement: Native settings and Web console access

The CLI SHALL use the native settings window as the configuration entry point and SHALL retain a separate one-time bridge launch path for the deployed Web console.

#### Scenario: Native settings opens

- **WHEN** the tray is installed or running and the user invokes `chc agent settings`
- **THEN** the CLI opens or foregrounds the native setup/settings window through authenticated same-user control

#### Scenario: Web console is opened from native settings

- **WHEN** the user has a verified deployment configuration and selects Open Web Console
- **THEN** the Agent creates a fresh single-use bridge launch and opens the exact derived `/agent` URL

### Requirement: Verified Agent update and rollback

`chc agent update` SHALL update only the local Agent, atomically activate a compatible self-use version after native setup/integrity/readiness checks, and retain mutable Origin, profiles, logs, browser settings, and ignored legacy Secret files across activation.

#### Scenario: Update succeeds

- **WHEN** a newer compatible self-use version is available and its archive, native setup assets, and startup checks pass
- **THEN** the CLI stages it, coordinates shutdown, switches versions, starts the tray/Agent, and keeps the prior version for local rollback

#### Scenario: New version fails readiness

- **WHEN** the activated Agent does not become healthy within the bound
- **THEN** the CLI stops it, restores and restarts the previous version, and preserves user configuration

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

## REMOVED Requirements

### Requirement: Safe environment configuration

**Reason**: Self-use no longer ships multiple verified catalog environments or exposes a production environment selector; Origin is configured in the native settings window and access relies on the deployment's private-network boundary.

**Migration**: Existing catalog-backed installations map their single active profile to the `self-use` configuration when unambiguous. Users with multiple environments must choose the deployment Origin in native settings; existing files are preserved until explicit cleanup.
