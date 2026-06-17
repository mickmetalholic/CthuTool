## ADDED Requirements

### Requirement: Browser automation composition module retired
The backend SHALL NOT expose `BrowserAutomationModule` as a standalone browser domain or composition module; browser-facing routes and services MUST be owned by their browser capability modules.

#### Scenario: Browser behavior is registered
- **WHEN** the backend application starts
- **THEN** it imports browser auth, content, sites, and desktop runtime modules directly instead of importing `BrowserAutomationModule`

## REMOVED Requirements

### Requirement: Internal browser content service
**Reason**: Browser content behavior belongs to `apps-backend-browser-content`; browser automation should not remain as a standalone composition module.

**Migration**: Import browser content services directly from the browser content module.

### Requirement: Browser provider abstraction
**Reason**: Browser provider ownership moves to `apps-backend-desktop-browser-runtime`.

**Migration**: Browser content uses desktop browser runtime instead of a browser automation provider composition module.

### Requirement: Origin allowlist enforcement
**Reason**: Origin allowlist behavior belongs to browser content and site configuration modules.

**Migration**: Keep origin allowlist enforcement in `apps-backend-browser-content`.

### Requirement: Task execution controls
**Reason**: Browser task execution controls belong to browser content orchestration.

**Migration**: Keep timeout, concurrency, delay, retry, and resource blocking behavior in `apps-backend-browser-content`.

### Requirement: Block and auth detection
**Reason**: Browser detection behavior belongs to browser content and auth workflows.

**Migration**: Keep block detection in `apps-backend-browser-content` and represent auth-required outcomes as interaction challenges.

### Requirement: Diagnostics storage
**Reason**: Diagnostics persistence belongs to browser content.

**Migration**: Keep diagnostic identifiers and artifact handling in `apps-backend-browser-content`.

### Requirement: Backend browser site configuration
**Reason**: Browser-facing site APIs belong to the browser sites module organization.

**Migration**: Move browser site routes to the browser sites module while preserving response compatibility where required.

### Requirement: Agent-backed browser provider
**Reason**: Agent-backed browser provider composition is replaced by desktop browser runtime.

**Migration**: Browser content consumes `DesktopBrowserRuntimeModule` for browser execution.

### Requirement: Pending auth task coordination
**Reason**: Pending auth task coordination is replaced by operation-scoped interaction challenges.

**Migration**: Browser auth/content modules return challenge metadata instead of mutating pending task state.
