## MODIFIED Requirements

### Requirement: Agent registry is transport-only
The backend agent registry SHALL own only desktop client connection lifecycle, public client metadata, online status, heartbeat freshness, and generic capability advertisement.

#### Scenario: Browser-capable agent registers
- **WHEN** a desktop agent registers with browser capability
- **THEN** the registry stores the browser capability string as public agent metadata without storing browser profiles, pending auth tasks, browser diagnostics, browser page state, or browser state snapshots

#### Scenario: Capability-specific message arrives
- **WHEN** a registered desktop agent sends a capability-specific non-JSON-RPC message
- **THEN** the registry rejects, delegates, or ignores the message according to transport routing policy without mutating capability state in registry storage

## ADDED Requirements

### Requirement: Registry accepts generic JSON-RPC command responses
The backend agent registry and WebSocket server SHALL route JSON-RPC command responses to the command gateway without understanding the capability that produced the response.

#### Scenario: JSON-RPC success arrives
- **WHEN** a registered desktop agent sends a JSON-RPC success response with an id
- **THEN** the WebSocket server forwards the response to the command gateway correlation path without inspecting the result payload

#### Scenario: JSON-RPC error arrives
- **WHEN** a registered desktop agent sends a JSON-RPC error response with an id
- **THEN** the WebSocket server forwards the response to the command gateway correlation path without interpreting application error codes or browser challenges
