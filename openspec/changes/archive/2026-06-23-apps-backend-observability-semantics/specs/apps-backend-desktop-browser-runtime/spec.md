## ADDED Requirements

### Requirement: Desktop browser runtime observability
The backend desktop browser runtime SHALL preserve request and command correlation while reporting selected agent availability, browser capability status, command outcome, and runtime diagnostics.

#### Scenario: Runtime unavailable is observable
- **WHEN** no online desktop agent has browser capability
- **THEN** the runtime returns its existing unavailable result and emits an observable event with a stable reason code and request correlation metadata when available

#### Scenario: Runtime command result is correlated
- **WHEN** a desktop browser runtime command completes or fails
- **THEN** the backend records the command id, agent id, command type, duration, and outcome without exposing raw browser artifacts
