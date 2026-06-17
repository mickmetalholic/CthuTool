## ADDED Requirements

### Requirement: Agent state excludes capability state
The backend SHALL NOT use agent state modules to store capability-specific browser profiles, pending auth tasks, page state, diagnostics, or site-specific browser status.

#### Scenario: Browser status is needed
- **WHEN** a backend service needs browser profile or runtime status
- **THEN** it queries the desktop browser runtime on demand rather than reading agent state projection

#### Scenario: Agent status is needed
- **WHEN** a caller needs connected desktop client status
- **THEN** it reads registry-owned public agent status containing only client metadata, online state, freshness, and capabilities

## REMOVED Requirements

### Requirement: Agent public state projection
**Reason**: The planned agent boundary does not include capability state projection as a separate backend-owned read model.

**Migration**: Keep public agent status in the registry boundary and query capability modules on demand.

### Requirement: Browser state slice
**Reason**: Browser profile summaries and pending auth tasks are browser capability state, not agent state.

**Migration**: Query `desktop-browser-runtime` on demand and surface operation-scoped interaction challenges from browser auth/content workflows.

### Requirement: Capability-neutral state slices
**Reason**: Generic state slices invite capability state to accumulate in the agent layer.

**Migration**: Future capabilities SHALL define their own runtime/query modules if they need capability state.
