## ADDED Requirements

### Requirement: Runtime observable state
The shared app-shell runtime SHALL expose optional observable state and diagnostics capabilities through host-neutral runtime contracts.

#### Scenario: Host provides observable state
- **WHEN** a desktop or web host adapter has backend, agent, browser, or diagnostics state
- **THEN** it can provide that state to shared app-shell pages through typed runtime data

#### Scenario: Missing observable state is handled
- **WHEN** a host adapter does not provide observable state
- **THEN** shared app-shell pages render a safe unavailable or unknown status instead of assuming desktop-only capabilities

### Requirement: Runtime console diagnostics contract
The shared app-shell runtime SHALL allow shared pages to use a host-provided frontend logger while remaining safe for web and desktop renderers.

#### Scenario: Shared page logs through runtime
- **WHEN** a shared page emits a diagnostic event
- **THEN** it uses the runtime-provided logger or a safe no-op/default logger rather than directly depending on a host-specific console implementation
