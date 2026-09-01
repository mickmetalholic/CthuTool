## MODIFIED Requirements

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
