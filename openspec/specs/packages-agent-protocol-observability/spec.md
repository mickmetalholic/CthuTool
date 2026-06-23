# packages-agent-protocol-observability Specification

## Purpose
Define shared agent protocol correlation metadata, compatibility, validation, and redaction semantics for observability across backend, desktop, and CLI-facing workflows.

## Requirements
### Requirement: Protocol correlation metadata
The agent protocol SHALL define optional observability metadata for agent messages, browser commands, browser results, browser errors, and browser state snapshots.

#### Scenario: Command carries correlation
- **WHEN** the backend sends a browser command with observability metadata
- **THEN** the protocol validates bounded request id, trace id, parent id, command id, and operation name fields and makes them available to the desktop agent

#### Scenario: Response preserves correlation
- **WHEN** the desktop agent responds to a correlated command
- **THEN** the protocol allows the result or error message to preserve the command correlation metadata without requiring raw request payloads

### Requirement: Protocol metadata compatibility
The agent protocol SHALL remain compatible with peers that omit optional observability metadata.

#### Scenario: Older peer omits metadata
- **WHEN** an agent or backend message omits observability metadata
- **THEN** protocol parsing continues to accept the message and downstream consumers use command id and agent id as the minimum correlation fields

### Requirement: Protocol metadata redaction
The agent protocol SHALL prevent observability metadata from carrying arbitrary sensitive payloads.

#### Scenario: Unknown metadata payload is rejected
- **WHEN** observability metadata contains unsupported object payloads, unbounded strings, or sensitive raw artifact fields
- **THEN** protocol validation rejects the message or strips unsupported fields according to the protocol parsing policy
