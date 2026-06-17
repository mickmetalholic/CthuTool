## ADDED Requirements

### Requirement: Browser agent capture capability retired
The backend SHALL NOT expose browser capture as an agent-named module capability; browser capture execution MUST be owned by `apps-backend-desktop-browser-runtime`.

#### Scenario: Capture execution is requested
- **WHEN** backend browser content or auth workflows need desktop browser capture
- **THEN** they use `desktop-browser-runtime` instead of `BrowserAgentCaptureModule`

## REMOVED Requirements

### Requirement: Browser agent capture module
**Reason**: Browser capture execution should be modeled as a desktop browser runtime capability, not as an agent-named browser module.

**Migration**: Move browser capture command mapping and provider ownership to `apps-backend-desktop-browser-runtime`.

### Requirement: Agent browser command mapping
**Reason**: Agent-named browser command mapping couples browser capability behavior to agent module naming and ownership.

**Migration**: `desktop-browser-runtime` maps browser capture requests to typed browser capability commands through the generic agent command gateway.

### Requirement: Agent browser error mapping
**Reason**: Browser command errors are browser runtime outcomes, not agent transport outcomes.

**Migration**: `desktop-browser-runtime`, `browser-auth`, and `browser-content` map browser errors into runtime results, detections, or interaction challenges.
