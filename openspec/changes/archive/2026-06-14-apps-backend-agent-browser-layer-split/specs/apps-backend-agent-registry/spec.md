## MODIFIED Requirements

### Requirement: Browser state snapshot WebSocket messages
The backend agent WebSocket server SHALL accept browser state snapshot messages from registered desktop agents and route them to `AgentStateModule` without exposing raw WebSocket internals to browser automation services.

#### Scenario: Registered agent sends browser state snapshot
- **WHEN** a registered desktop agent sends a valid `browser.stateSnapshot` message over its active WebSocket connection
- **THEN** the backend routes the snapshot to the agent state projection handler with the registered agent id and snapshot payload

#### Scenario: Unregistered socket sends browser state snapshot
- **WHEN** a socket sends a `browser.stateSnapshot` message before successful `agent.hello` registration
- **THEN** the backend rejects or ignores the message without updating agent state, browser profile state, or pending-auth state

#### Scenario: Replaced connection sends stale snapshot
- **WHEN** an older connection for an agent id sends a `browser.stateSnapshot` after a newer connection has become authoritative
- **THEN** the backend ignores the stale snapshot and keeps the authoritative connection's agent state projection

#### Scenario: Invalid browser state snapshot is rejected
- **WHEN** a registered agent sends a malformed `browser.stateSnapshot` payload
- **THEN** the backend logs a validation summary and does not update agent state, browser profile state, or pending-auth state

## ADDED Requirements

### Requirement: Agent registry delegates capability state
The backend agent registry SHALL own connection registration and online status, while capability-specific state projection is delegated to agent state modules.

#### Scenario: Agent registers with browser capability
- **WHEN** a desktop agent registers with browser capability
- **THEN** the agent registry records the capability in online status without owning browser profile or pending-auth state storage

#### Scenario: Agent state module is unavailable
- **WHEN** an agent state handler is not registered for a capability-specific snapshot
- **THEN** the agent registry keeps the agent connection healthy and logs the missing handler without storing capability state in the registry

### Requirement: Agent registry delegates command dispatch
The backend agent registry SHALL provide connection lookup and online status to the command gateway without exposing command correlation or business command behavior as registry responsibilities.

#### Scenario: Command gateway asks for active connection
- **WHEN** `AgentCommandGateway` needs to dispatch a command to an online agent
- **THEN** the agent registry or WebSocket server provides the authoritative active connection without making business command decisions

#### Scenario: Business module does not use registry directly
- **WHEN** a browser module needs to execute a desktop command
- **THEN** it uses the command gateway or a browser-facing provider instead of directly using the agent registry or raw WebSocket server
