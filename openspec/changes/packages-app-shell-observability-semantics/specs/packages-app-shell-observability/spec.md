## ADDED Requirements

### Requirement: Shared frontend logger
The app-shell package SHALL define shared frontend logger semantics for levels, scopes, event names, correlation fields, safe contextual details, and environment-specific console behavior.

#### Scenario: Shared logger structures console output
- **WHEN** a shared page or host adapter emits a frontend diagnostic event
- **THEN** it uses the shared logger shape with level, scope, event, message, and bounded details

#### Scenario: Production console behavior is constrained
- **WHEN** app-shell code runs in a production frontend environment
- **THEN** debug and info console diagnostics are disabled by default while warn and error output remains redacted

### Requirement: Shared observable status presentation
The app-shell package SHALL define host-neutral presentation semantics for backend connectivity, agent state, browser runtime state, diagnostics availability, degraded modes, and diagnostics links.

#### Scenario: Status summary is host-neutral
- **WHEN** a shared page renders observable status
- **THEN** the page consumes host-provided observable state through typed runtime data rather than reading Electron, browser, or backend globals directly

#### Scenario: Diagnostics link is safe
- **WHEN** a shared page displays a diagnostics identifier or link
- **THEN** it presents only safe identifiers and summaries, not raw artifacts or local paths
