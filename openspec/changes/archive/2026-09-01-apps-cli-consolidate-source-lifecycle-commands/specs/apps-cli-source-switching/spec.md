## ADDED Requirements

### Requirement: Consolidated source lifecycle command namespace

The CLI SHALL expose installation diagnosis and managed update as public operations of the `source` command group while keeping source inventory and active-installation diagnosis as separate operations. The canonical public source operations SHALL be `list`, `status`, `use`, `update`, and `register`.

#### Scenario: Bare source group is invoked

- **WHEN** a user runs `chc source` or `chc source --help`
- **THEN** help contains `list`, `status`, `use`, `update`, and `register`
- **AND** help does not contain the removed `current` operation
- **AND** it exits without inspecting remote update state or changing the global installation, Git state, or source registry

#### Scenario: Root command discovery is requested

- **WHEN** a user views root help or requests top-level shell completion candidates
- **THEN** `source` is included as the public entry point for source lifecycle operations
- **AND** top-level `status` and `update` are not listed

#### Scenario: Source operation completion is requested

- **WHEN** a user requests shell completion after `chc source`
- **THEN** candidates include `list`, `status`, `use`, `update`, and `register`
- **AND** candidates do not include `current`

#### Scenario: Source inventory is requested

- **WHEN** a user runs `chc source list`
- **THEN** the CLI reports all discovered source candidates and identifies the active source
- **AND** it does not replace the inventory with detailed installation diagnostics for only the active source

#### Scenario: Active installation diagnosis is requested

- **WHEN** a user runs `chc source status`
- **THEN** the CLI reports detailed installation state for the actual active source or an explicitly requested install directory
- **AND** it does not render the multi-candidate source inventory

#### Scenario: Managed source update is requested

- **WHEN** a user runs `chc source update`
- **THEN** the CLI applies the established managed update behavior to the actual active source or explicit install-directory override
- **AND** it does not implicitly select another source before updating

### Requirement: Source lifecycle route compatibility

Canonical and compatibility lifecycle routes SHALL preserve the shared human, quiet, JSON stdout, diagnostics, error, flag, and exit-status contracts while identifying the route actually invoked in successful machine output.

#### Scenario: Canonical source status JSON succeeds

- **WHEN** a user runs `chc source status --json`
- **THEN** stdout contains exactly one success object with `command: "source status"` and the existing structured installation status fields
- **AND** diagnostics remain off stdout

#### Scenario: Canonical source update JSON succeeds

- **WHEN** a managed or explicitly targeted `chc source update --json` succeeds or is already current
- **THEN** stdout contains exactly one success object with `command: "source update"` and the existing structured update result and identity details
- **AND** diagnostics remain off stdout

#### Scenario: Legacy top-level status alias is invoked

- **WHEN** a user runs `chc status` with any supported status flags
- **THEN** the CLI performs the same diagnosis and returns the same human, quiet, error, and exit-status behavior as `chc source status`
- **AND** a successful JSON response retains `command: "status"`

#### Scenario: Legacy top-level update alias is invoked

- **WHEN** a user runs `chc update` with any supported update flags
- **THEN** the CLI performs the same update or check and returns the same human, quiet, error, safety, and exit-status behavior as `chc source update`
- **AND** a successful JSON response retains `command: "update"`

#### Scenario: Canonical lifecycle operation fails

- **WHEN** installation inspection, update preflight, Git, bundle verification, global install, or postcondition verification fails through a canonical source route
- **THEN** the command exits non-zero with the existing stable error code and bounded recovery context
- **AND** compatibility routing does not weaken or bypass the underlying safety checks
