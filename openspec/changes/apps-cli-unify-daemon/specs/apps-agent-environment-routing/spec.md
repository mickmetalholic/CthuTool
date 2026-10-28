## MODIFIED Requirements

### Requirement: Trusted environment catalog
The installed daemon SHALL derive one self-use Backend connection from a user-configured exact deployment Origin. It SHALL NOT require a release catalog, Web Origin, Web Agent URL, or local-browser bootstrap configuration. Production Origins SHALL use HTTPS; insecure loopback development SHALL require explicit non-production opt-in.

#### Scenario: Packaged environment is loaded
- **WHEN** a valid Origin is configured
- **THEN** the daemon derives the Backend HTTP base and corresponding WSS /ws/agents endpoint with the fixed self-use identity

#### Scenario: Catalog entry is invalid
- **WHEN** configuration includes an invalid protocol, path, query, or fragment
- **THEN** it is rejected before persistence or connection and the prior configuration remains unchanged

#### Scenario: Custom development environment is added
- **WHEN** non-production development explicitly opts into an insecure loopback Origin
- **THEN** only that loopback exception is accepted without creating multi-environment selection or a packaged catalog dependency

### Requirement: Single active environment
The daemon SHALL connect exactly one self-use deployment per selected user data root and SHALL report missing configuration through the CLI without starting a persistent unconfigured process.

#### Scenario: Agent starts with a selected environment
- **WHEN** a valid Origin is persisted
- **THEN** startup uses its derived connection and preserved self-use Profile/data namespace

#### Scenario: No environment is selected
- **WHEN** daemon start runs without a valid Origin
- **THEN** it returns setup-required remediation without establishing a Backend connection or entering an automatic restart loop

### Requirement: Environment-scoped mutable state
The daemon SHALL preserve the existing user data root and selected self-use Profile namespace across the command and packaging migration. Legacy namespaces SHALL remain intact until an explicit unambiguous migration selects data; static Agent secrets SHALL remain ignored and SHALL NOT become configuration inputs.

#### Scenario: Existing self-use data is present
- **WHEN** the CLI takes over the installation
- **THEN** existing Profiles, device identity, browser settings, and logs remain usable without being relocated merely because the public command changed

#### Scenario: Multiple legacy namespaces exist
- **WHEN** automatic data selection would be ambiguous
- **THEN** takeover reports a selection/remediation error without merging, deleting, or borrowing another namespace's browser data

#### Scenario: Legacy secret file exists
- **WHEN** the existing directory contains an agent-secret file
- **THEN** the daemon ignores it and does not delete it implicitly

#### Scenario: Test environment uses a profile
- **WHEN** a development/test run uses an explicitly isolated data root
- **THEN** it owns only that root's selected self-use Profile namespace and does not import production browser data implicitly

#### Scenario: Environment diagnostics are read
- **WHEN** local deployment diagnostics are requested
- **THEN** they identify the fixed environment and bounded state without another legacy namespace's authorization or Profile contents

### Requirement: Redacted environment diagnostics
Deployment diagnostics SHALL include bounded connection and candidate-configuration outcomes without credentials, cookies, or raw browser data; the derived fixed environment identity SHALL remain visible for troubleshooting Backend compatibility.

#### Scenario: Backend rejects a connection
- **WHEN** the private-peer or environment-id check rejects a daemon
- **THEN** diagnostics identify the bounded rejection category and environment without treating the Agent ID as a credential

#### Scenario: Candidate configuration fails
- **WHEN** verification of a running daemon's candidate Origin fails
- **THEN** diagnostics identify the failed phase and confirm the prior deployment remains active without printing private payloads

#### Scenario: Environment switch is recorded
- **WHEN** a retired environment-switch operation is attempted
- **THEN** diagnostics report its rejection and unchanged fixed deployment without raw browser data

### Requirement: Self-use environment selection boundary
The installed CLI daemon SHALL expose a single self-use environment and SHALL reject arbitrary environment switching. A deployment Origin change SHALL use validated CLI configuration rather than a catalog selector.

#### Scenario: Self-use environment is requested
- **WHEN** local status or Backend registration requests deployment identity
- **THEN** the fixed self-use environment is reported consistently

#### Scenario: Self-use environment switch is requested
- **WHEN** an old environment-selection operation is attempted
- **THEN** it returns single-deployment remediation without changing the active data root or connection

## REMOVED Requirements

### Requirement: Coordinated environment switching
**Reason**: Catalog selection and tray-driven switching are retired in the single-deployment CLI daemon.

**Migration**: Use validated chc daemon configuration to change deployment Origin with coordinated browser cleanup and reconnect.

### Requirement: Active environment Web-origin binding
**Reason**: The Web-to-local bridge and its Origin/ticket boundary are removed.

**Migration**: CLI management uses protected same-user IPC; remote calls use the existing Backend access boundary.
