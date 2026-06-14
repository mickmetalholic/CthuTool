## ADDED Requirements

### Requirement: Agent command gateway
The backend SHALL provide an `AgentCommandGatewayModule` that dispatches commands to registered desktop agents and correlates responses without exposing raw WebSocket internals to business modules.

#### Scenario: Command is dispatched to agent
- **WHEN** a backend service sends a command to a registered online agent through the gateway
- **THEN** the gateway writes the protocol command to the agent's active WebSocket connection and tracks the command correlation id

#### Scenario: Command response is correlated
- **WHEN** the desktop agent sends a result for a pending command id
- **THEN** the gateway resolves the matching backend command request with the result payload

#### Scenario: Command error is correlated
- **WHEN** the desktop agent sends an error for a pending command id
- **THEN** the gateway resolves the matching backend command request as a structured command error

#### Scenario: Command times out
- **WHEN** the desktop agent does not respond before the configured timeout
- **THEN** the gateway fails the command with a timeout error and removes the pending correlation entry

### Requirement: Capability-based agent selection
The backend command gateway SHALL select eligible agents by advertised capability without embedding browser-specific selection logic in the agent registry.

#### Scenario: Capability agent is available
- **WHEN** a backend service requests command dispatch for a capability and an online agent advertises that capability
- **THEN** the gateway selects an eligible online agent and dispatches the command

#### Scenario: Capability agent is missing
- **WHEN** no online agent advertises the requested capability
- **THEN** the gateway fails before command dispatch with an agent capability or availability error

#### Scenario: Unknown command capability is handled
- **WHEN** a backend service requests an unsupported or unknown capability
- **THEN** the gateway returns a structured error without modifying agent state

### Requirement: Gateway hides transport internals
The backend command gateway SHALL hide WebSocket connection objects, raw headers, connection replacement details, and protocol correlation maps from browser and other business modules.

#### Scenario: Business module sends command
- **WHEN** a business module dispatches a command through `AgentCommandGateway`
- **THEN** it provides a typed command payload and receives a typed result or structured error without accessing WebSocket internals

#### Scenario: Agent reconnects during command
- **WHEN** an agent connection is replaced while a command is pending
- **THEN** the gateway fails or reroutes the command according to gateway policy without exposing stale socket objects to the caller
