## ADDED Requirements

### Requirement: Headless local agent process
The workspace SHALL provide an Electron-independent Node.js agent process that composes backend connectivity, browser capability hosting, configuration, profiles, and diagnostics.

#### Scenario: Agent starts without Electron
- **WHEN** the headless agent entry point starts with valid user-scoped configuration
- **THEN** it initializes without importing or launching Electron and proceeds to runtime readiness

#### Scenario: Agent starts without a graphical session window
- **WHEN** the headless agent runs in a supported user session
- **THEN** it does not create an application window or embedded WebView

### Requirement: Runtime readiness and health
The agent SHALL expose versioned local health state that distinguishes process readiness from backend connection state.

#### Scenario: Runtime becomes ready
- **WHEN** configuration is loaded, the instance/profile locks are held, and browser capability initialization completes
- **THEN** local health reports the runtime as ready with its protocol and application versions

#### Scenario: Backend is unavailable
- **WHEN** the local runtime is healthy but cannot connect to the backend
- **THEN** process health remains ready or degraded and separately reports the backend as offline

#### Scenario: Runtime is still initializing
- **WHEN** a supervisor asks for health before initialization completes
- **THEN** health reports starting and does not advertise browser readiness

### Requirement: Outbound backend agent connection
The agent SHALL preserve the existing reconnecting WebSocket lifecycle and capability advertisement through the shared agent protocol.

#### Scenario: Agent registers after connection
- **WHEN** a configured backend WebSocket becomes available
- **THEN** the runtime registers its identity, version, platform, and ready capabilities and begins heartbeats

#### Scenario: Backend connection is interrupted
- **WHEN** an established backend connection closes unexpectedly
- **THEN** the runtime remains alive and reconnects with bounded backoff without losing local profiles

### Requirement: Agent-owned browser capability
The headless runtime SHALL provide the controlled browser commands, action limits, access controls, and result bounds previously hosted by the Electron main process.

#### Scenario: Supported browser command is received
- **WHEN** the backend dispatches a valid supported browser command to the ready runtime
- **THEN** the runtime executes it under the existing browser runtime protocol and returns a correlated bounded result or structured error

#### Scenario: Arbitrary script is requested
- **WHEN** a command attempts to execute an unsupported arbitrary script payload
- **THEN** the runtime rejects it without evaluating the payload

#### Scenario: Host Chrome is unavailable
- **WHEN** browser initialization cannot discover the configured host Chrome runtime
- **THEN** the agent reports browser capability unavailable with sanitized diagnostics and remains controllable locally

### Requirement: Exclusive local profile ownership
The agent SHALL keep raw browser profiles local and SHALL prevent concurrent runtimes from owning the same profile root.

#### Scenario: Profile root is available
- **WHEN** one agent instance acquires the user-scoped profile lock
- **THEN** it may create and use controlled browser contexts without sending raw profile data to the backend

#### Scenario: Profile root is already owned
- **WHEN** another valid runtime owns the same profile root
- **THEN** startup fails with actionable owner status before any profile is opened

### Requirement: User-scoped local supervisor control
The Agent SHALL expose a private versioned local control endpoint protected by operating-system user permissions and validated instance identity without requiring a persisted supervisor credential.

#### Scenario: Supervisor handshake succeeds
- **WHEN** the same-user supervisor connects through the protected socket or named pipe and presents the matching instance nonce and compatible protocol version
- **THEN** the Agent exposes health, sanitized status, and graceful shutdown operations

#### Scenario: Local caller lacks user access
- **WHEN** another operating-system user or an invalid stale instance record calls the endpoint
- **THEN** the Agent rejects access without returning runtime or profile details

#### Scenario: Control protocol is incompatible
- **WHEN** a supervisor requests an unsupported control protocol version
- **THEN** the Agent fails the handshake with a bounded compatibility error

### Requirement: Single active runtime instance
The agent SHALL maintain a user-scoped instance record and reject a second active owner.

#### Scenario: Second instance is started
- **WHEN** a healthy runtime already owns the instance lock
- **THEN** the second runtime exits without starting a backend connection or browser host

#### Scenario: Stale instance record exists
- **WHEN** an instance record points to no matching live process and cannot complete the identity/version handshake
- **THEN** startup recovers the stale record before acquiring ownership

### Requirement: Graceful runtime shutdown
The agent SHALL stop accepting commands, close controlled browser contexts, release profile locks, and close backend/local endpoints during coordinated shutdown.

#### Scenario: Supervisor requests shutdown
- **WHEN** the validated same-user supervisor sends shutdown
- **THEN** the runtime enters stopping, rejects new commands, drains or cancels bounded work, closes browser contexts and connections, releases locks, and exits

#### Scenario: Process signal requests shutdown
- **WHEN** the runtime receives a supported termination signal
- **THEN** it follows the same graceful shutdown sequence as a supervisor request

### Requirement: Electron compatibility adapter
The existing Electron main process SHALL compose the same extracted agent runtime modules during the migration period.

#### Scenario: Desktop compatibility mode starts
- **WHEN** Electron starts and no standalone runtime owns the user-scoped profile root
- **THEN** it uses the shared runtime implementation while preserving existing desktop-visible behavior

#### Scenario: Standalone runtime already owns profiles
- **WHEN** Electron starts while the standalone runtime owns the profile root
- **THEN** Electron does not create a second browser host and presents an actionable conflict state

### Requirement: Sanitized local diagnostics
The runtime SHALL emit structured lifecycle and browser diagnostics without backend secrets, instance nonces, local bridge tickets, raw profile data, or unbounded command payloads.

#### Scenario: Runtime event is recorded
- **WHEN** startup, connection, browser command, shutdown, or failure state changes
- **THEN** the event includes bounded correlation and state fields suitable for local-bridge and CLI diagnostics

#### Scenario: Sensitive value reaches diagnostics
- **WHEN** a diagnostic input contains a backend secret, instance nonce, local bridge ticket/token, cookie, or raw browser artifact
- **THEN** the runtime removes or redacts the sensitive value before persistence or output
