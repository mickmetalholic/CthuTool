## MODIFIED Requirements

### Requirement: Agent command gateway
The backend SHALL provide an Agent command gateway that dispatches JSON-RPC requests to the authoritative Agent connection for an explicit trusted environment and correlates responses without exposing transport internals or capability-specific logic.

#### Scenario: Command is dispatched to environment Agent
- **WHEN** an authenticated operator request supplies trusted environment context, required capability, `id`, `method`, optional `params`, and timeout and that environment Agent is online
- **THEN** the gateway writes only to the authoritative connection for that environment and tracks environment id, Agent id, command id, and connection generation

#### Scenario: Environment context is missing
- **WHEN** a machine-control request reaches the gateway without a trusted environment id
- **THEN** the gateway rejects dispatch and does not select the first capable Agent

#### Scenario: Command response is correlated
- **WHEN** the authoritative connection returns JSON-RPC success for the pending environment, Agent, id, and generation
- **THEN** the gateway resolves the matching request with its result payload

#### Scenario: Command error is correlated
- **WHEN** the authoritative connection returns JSON-RPC error for the pending environment, Agent, id, and generation
- **THEN** the gateway resolves a structured command error with numeric code, message, and optional data

#### Scenario: Command times out
- **WHEN** the environment Agent does not respond before timeout
- **THEN** the gateway fails and removes the pending entry without routing to another environment

### Requirement: Gateway hides transport internals
The gateway SHALL hide WebSocket objects, raw headers, connection replacement details, static secrets, operator sessions, correlation maps, and capability-specific mapping from business modules.

#### Scenario: Business module sends command
- **WHEN** an authenticated business request dispatches through the gateway
- **THEN** it supplies trusted environment context, generic capability, method, and params and receives a result or structured error without transport or secret access

#### Scenario: Agent reconnects during command
- **WHEN** the target environment's connection generation changes while a command is pending
- **THEN** the gateway fails the old command without silently rerouting it to the new generation or another environment

#### Scenario: Browser module sends command
- **WHEN** a browser module needs local browser execution
- **THEN** it uses the browser runtime provider with trusted environment context rather than a browser-specific gateway method

### Requirement: Gateway remains capability-neutral
The gateway SHALL dispatch by trusted environment, stable Agent id, required generic capability, JSON-RPC id, method, params, timeout, generation, and connection state only.

#### Scenario: Browser command is dispatched
- **WHEN** the environment Agent advertises the required generic browser capability
- **THEN** the gateway does not import browser schemas, branch on browser method names, inspect params, or convert browser challenges

#### Scenario: Unknown method is dispatched
- **WHEN** an authenticated caller sends a syntactically valid method unknown to the gateway
- **THEN** the gateway treats it as opaque and leaves method-level validation to the Agent runtime

#### Scenario: Agent lacks capability
- **WHEN** the environment Agent does not advertise the required generic capability
- **THEN** the gateway rejects before writing to the connection

### Requirement: Command gateway observability
The gateway SHALL emit redacted command lifecycle events with environment id, Agent id, connection generation, command id, method, timeout, outcome, and request correlation when available.

#### Scenario: Dispatch is observable
- **WHEN** an authenticated request dispatches an Agent command
- **THEN** the gateway records bounded environment/Agent/correlation metadata without params, operator sessions, or Agent secrets

#### Scenario: Timeout is observable
- **WHEN** a pending command times out
- **THEN** the gateway records the timeout and removes correlation without exposing raw socket or secret data
