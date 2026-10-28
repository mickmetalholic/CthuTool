## MODIFIED Requirements

### Requirement: Headless local agent process
The workspace SHALL provide a UI-free Node.js Agent runtime launched through the installed CLI daemon foreground/background modes. It SHALL compose Backend connectivity, browser hosting, configuration, Profiles, and diagnostics without a standalone Agent application, native supervisor, or local Web server.

#### Scenario: Agent starts without Electron
- **WHEN** a configured user starts the daemon from the installed CLI
- **THEN** the existing browser and WSS capabilities initialize under that CLI build identity without importing a tray, native setup UI, or Electron

#### Scenario: Agent starts without a graphical session window
- **WHEN** the daemon starts for headless browser work
- **THEN** it creates no application window or WebView, while visible browser login remains an explicit graphical-session operation

### Requirement: User-scoped local supervisor control
The runtime SHALL expose a private versioned same-user local endpoint for health/status, configuration, Profile list/login/verify/remove, and graceful shutdown. Access SHALL validate OS user permissions, instance nonce, process identity, and protocol compatibility without a reusable Web bearer or HTTP bridge.

#### Scenario: Supervisor handshake succeeds
- **WHEN** a same-user CLI presents the current instance identity and compatible control protocol
- **THEN** it can perform only documented typed management operations with bounded requests and responses

#### Scenario: Local caller lacks user access
- **WHEN** another OS user or an invalid/stale instance attempts management
- **THEN** access is rejected without exposing runtime or browser data

#### Scenario: Control protocol is incompatible
- **WHEN** management requests an unsupported protocol version
- **THEN** the endpoint reports a bounded compatibility error and performs no mutation

#### Scenario: Local and Backend browser work overlap
- **WHEN** local Profile management and Backend browser requests address the same runtime
- **THEN** shared execution ordering and ownership checks prevent concurrent unsafe use or deletion of a Profile

### Requirement: Sanitized local diagnostics
The runtime SHALL emit bounded structured lifecycle, configuration, connection, and browser diagnostics suitable for CLI status/logs/doctor without credentials, instance nonces, cookies, raw Profile data, or unbounded command payloads.

#### Scenario: Runtime event is recorded
- **WHEN** startup, connection, browser work, configuration, or shutdown changes state
- **THEN** diagnostics include bounded correlation, build identity, and state fields usable without a Web bridge

#### Scenario: Sensitive value reaches diagnostics
- **WHEN** a diagnostic contains authorization material, an instance nonce, cookies, a legacy bridge token, or raw browser artifacts
- **THEN** the runtime removes or redacts it before output or persistence

## ADDED Requirements

### Requirement: Host Chrome and independent browser data
The daemon SHALL use host-installed Chrome, discovering its standard installation or accepting an explicit executable path, and SHALL keep its browser Profiles separate from the user's everyday Chrome profile.

#### Scenario: Host Chrome is absent
- **WHEN** Chrome cannot be discovered or launched
- **THEN** local management remains available, browser readiness is unavailable, and the runtime does not advertise browser capability

#### Scenario: Backend requests browser work
- **WHEN** an authorized controlled request reaches a ready daemon
- **THEN** it executes in an owned browser context using the selected local Profile rather than attaching to arbitrary user-opened Chrome tabs

### Requirement: No local HTTP browser surface
The daemon SHALL NOT listen for local HTTP bridge/bootstrap requests or serve local Web assets; CLI management SHALL use protected IPC and remote browser requests SHALL use the existing Backend connection.

#### Scenario: Daemon endpoints are inspected
- **WHEN** the daemon is running
- **THEN** its local management endpoint is a user-scoped socket or named pipe and no replacement HTTP bridge or browser bearer bootstrap endpoint exists
