## MODIFIED Requirements

### Requirement: Agent command gateway
The backend SHALL provide an agent command gateway that dispatches JSON-RPC 2.0-compatible command requests to registered desktop agents and correlates JSON-RPC success or error responses without exposing raw WebSocket internals or capability-specific business logic to callers.

#### Scenario: Command is dispatched to agent
- **WHEN** a backend service sends a command with `id`, `method`, and optional `params` to a registered online agent through the gateway
- **THEN** the gateway writes a JSON-RPC request envelope to the agent's active WebSocket connection and tracks the command correlation id without inspecting capability-specific payload fields

#### Scenario: Command response is correlated
- **WHEN** the desktop agent sends a JSON-RPC success response for a pending command id
- **THEN** the gateway resolves the matching backend command request with the response `result` payload

#### Scenario: Command error is correlated
- **WHEN** the desktop agent sends a JSON-RPC error response for a pending command id
- **THEN** the gateway resolves the matching backend command request as a structured command error containing numeric JSON-RPC error code, message, and optional data

#### Scenario: Command times out
- **WHEN** the desktop agent does not respond before the configured timeout
- **THEN** the gateway fails the command with a timeout error and removes the pending correlation entry

### Requirement: Gateway hides transport internals
The backend command gateway SHALL hide WebSocket connection objects, raw headers, connection replacement details, protocol correlation maps, and capability-specific command mapping from browser and other business modules.

#### Scenario: Business module sends command
- **WHEN** a business module dispatches a command through the agent command gateway
- **THEN** it provides a JSON-RPC method and params and receives a result or structured error without accessing WebSocket internals

#### Scenario: Agent reconnects during command
- **WHEN** an agent connection is replaced while a command is pending
- **THEN** the gateway fails or reroutes the command according to gateway policy without exposing stale socket objects to the caller

#### Scenario: Browser module sends command
- **WHEN** a browser module needs desktop browser execution
- **THEN** it uses the desktop browser runtime rather than a browser-specific gateway method

## ADDED Requirements

### Requirement: Gateway remains capability-neutral
The backend command gateway SHALL dispatch commands by agent selection, JSON-RPC id, method, params, timeout, and connection state only.

#### Scenario: Browser command is dispatched
- **WHEN** the gateway dispatches a browser runtime method
- **THEN** it does not import browser runtime protocol schemas, branch on browser method names, inspect browser params, or convert browser challenges

#### Scenario: Unknown method is dispatched
- **WHEN** a caller dispatches a syntactically valid method unknown to the gateway
- **THEN** the gateway treats it as an opaque command method and leaves capability validation to the target runtime
