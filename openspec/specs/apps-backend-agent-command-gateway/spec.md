# apps-backend-agent-command-gateway Specification

## Purpose
TBD - created by archiving change apps-backend-agent-browser-layer-split. Update Purpose after archive.
## Requirements
### Requirement: Agent command gateway
The backend SHALL provide an agent command gateway that dispatches typed commands to registered desktop agents and correlates typed responses without exposing raw WebSocket internals or capability-specific business logic to callers.

#### Scenario: Command is dispatched to agent
- **WHEN** a backend service sends a typed command to a registered online agent through the gateway
- **THEN** the gateway writes the protocol command to the agent's active WebSocket connection and tracks the command correlation id without inspecting capability-specific payload fields

#### Scenario: Command response is correlated
- **WHEN** the desktop agent sends a result for a pending command id
- **THEN** the gateway resolves the matching backend command request with the typed result payload

#### Scenario: Command error is correlated
- **WHEN** the desktop agent sends an error for a pending command id
- **THEN** the gateway resolves the matching backend command request as a structured typed command error

#### Scenario: Command times out
- **WHEN** the desktop agent does not respond before the configured timeout
- **THEN** the gateway fails the command with a timeout error and removes the pending correlation entry

### Requirement: Gateway hides transport internals
The backend command gateway SHALL hide WebSocket connection objects, raw headers, connection replacement details, protocol correlation maps, and capability-specific command mapping from browser and other business modules.

#### Scenario: Business module sends command
- **WHEN** a business module dispatches a command through the agent command gateway
- **THEN** it provides a typed command payload and receives a typed result or structured error without accessing WebSocket internals

#### Scenario: Agent reconnects during command
- **WHEN** an agent connection is replaced while a command is pending
- **THEN** the gateway fails or reroutes the command according to gateway policy without exposing stale socket objects to the caller

#### Scenario: Browser module sends command
- **WHEN** a browser module needs desktop browser execution
- **THEN** it uses the desktop browser runtime rather than a browser-specific gateway method

### Requirement: Gateway protocol correlation
The backend agent command gateway SHALL attach and preserve protocol observability metadata when dispatching typed commands and correlating responses.

#### Scenario: Request metadata is attached
- **WHEN** a backend request dispatches an agent command with request context
- **THEN** the gateway attaches bounded protocol observability metadata to the command message before writing it to the active agent connection

#### Scenario: Response metadata is preserved
- **WHEN** an agent command response includes observability metadata
- **THEN** the gateway preserves that metadata for backend runtime and diagnostic events
