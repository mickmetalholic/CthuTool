## ADDED Requirements

### Requirement: Command gateway observability
The agent command gateway SHALL emit observable command lifecycle events that correlate command identifiers, selected agent identifiers, timeout settings, outcomes, and request context when available.

#### Scenario: Command dispatch is observable
- **WHEN** a backend service dispatches a command through the agent command gateway
- **THEN** the gateway records a dispatch event containing command id, command type, target agent id, timeout, and request correlation metadata when present

#### Scenario: Command timeout is observable
- **WHEN** a pending command times out
- **THEN** the gateway records a timeout event and removes the pending correlation entry without exposing raw WebSocket internals to business modules
