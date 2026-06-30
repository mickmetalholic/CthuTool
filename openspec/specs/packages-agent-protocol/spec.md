# packages-agent-protocol Specification

## Purpose
Define the shared agent protocol package for capability-neutral lifecycle messages, JSON-RPC command envelopes, and browser-contract separation.

## Requirements
### Requirement: Generic agent lifecycle protocol
The `@cthutool/agent-protocol` package SHALL define only capability-neutral agent lifecycle messages, public agent metadata, public agent status, and command transport primitives.

#### Scenario: Agent lifecycle schemas are parsed
- **WHEN** backend or desktop code parses `agent.hello`, `agent.heartbeat`, `agent.registered`, or transport-level `agent.error` messages
- **THEN** the package validates those messages without importing browser runtime command, result, profile, or challenge schemas

#### Scenario: Public agent status is represented
- **WHEN** backend code exposes connected agent state
- **THEN** the package provides public status types containing connection state, client metadata, heartbeat freshness, and generic capability identifiers only

### Requirement: Normalized agent lifecycle message types
The `@cthutool/agent-protocol` package SHALL expose normalized lifecycle message type constants, a closed `AgentLifecycleMessageType` literal union, and discriminated union schemas for all `agent.*` lifecycle messages.

#### Scenario: Lifecycle type is referenced in code
- **WHEN** backend or desktop code creates, compares, switches on, or parses a lifecycle message type
- **THEN** it uses exported protocol constants or the `AgentLifecycleMessageType` type rather than ad hoc string literals

#### Scenario: Unknown lifecycle type is received
- **WHEN** an incoming agent lifecycle message contains a `type` value outside the normalized lifecycle type union
- **THEN** protocol parsing rejects the message before registry or connection state is mutated

#### Scenario: Lifecycle union is discriminated
- **WHEN** code parses an agent lifecycle message
- **THEN** the parsed value is narrowed by its `type` discriminator to the specific payload schema for hello, heartbeat, registration acknowledgement, or transport error

### Requirement: JSON-RPC command envelopes
The `@cthutool/agent-protocol` package SHALL provide JSON-RPC 2.0-compatible request, success response, and error response schemas for agent command dispatch.

#### Scenario: Command request is validated
- **WHEN** a command request is sent over the agent connection
- **THEN** it contains `jsonrpc: "2.0"`, a stable string or numeric `id`, a string `method`, and optional `params`

#### Scenario: Command success is correlated
- **WHEN** a command succeeds
- **THEN** the response contains `jsonrpc: "2.0"`, the matching `id`, and a `result` payload without a capability-specific transport frame type

#### Scenario: Command error is correlated
- **WHEN** a command fails
- **THEN** the response contains `jsonrpc: "2.0"`, the matching `id`, and an `error` object with numeric `code`, string `message`, and optional structured `data`

### Requirement: Agent protocol excludes browser contracts
The `@cthutool/agent-protocol` package SHALL NOT export browser method names, browser command params, browser results, browser profile metadata, browser detection payloads, browser auth task schemas, or browser interaction challenge schemas.

#### Scenario: Browser protocol is needed
- **WHEN** browser runtime code needs browser-specific methods or payload validation
- **THEN** it imports them from the browser runtime protocol boundary instead of `@cthutool/agent-protocol`

#### Scenario: Package dependency graph is evaluated
- **WHEN** package dependencies are installed or checked
- **THEN** `@cthutool/agent-protocol` has no dependency on the browser runtime protocol package or browser application modules
