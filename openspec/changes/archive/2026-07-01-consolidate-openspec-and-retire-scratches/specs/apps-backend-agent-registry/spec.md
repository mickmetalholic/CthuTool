## ADDED Requirements

### Requirement: Agent state excludes capability state
The backend SHALL NOT use agent state modules to store capability-specific browser profiles, pending auth tasks, page state, diagnostics, or site-specific browser status.

#### Scenario: Browser status is needed
- **WHEN** a backend service needs browser profile or runtime status
- **THEN** it queries the desktop browser runtime on demand rather than reading agent state projection

#### Scenario: Agent status is needed
- **WHEN** a caller needs connected desktop client status
- **THEN** it reads registry-owned public agent status containing only client metadata, online state, freshness, and capabilities
