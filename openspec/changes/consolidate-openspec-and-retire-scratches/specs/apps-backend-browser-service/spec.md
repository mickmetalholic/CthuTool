## ADDED Requirements

### Requirement: Browser agent capture capability retired
The backend SHALL NOT expose browser capture as an agent-named module capability; browser capture execution MUST be owned by `apps-backend-desktop-browser-runtime`.

#### Scenario: Capture execution is requested
- **WHEN** backend browser content or auth workflows need desktop browser capture
- **THEN** they use `desktop-browser-runtime` instead of `BrowserAgentCaptureModule`

### Requirement: Browser automation composition module retired
The backend SHALL NOT expose `BrowserAutomationModule` as a standalone browser domain or composition module, and the `apps/backend/src/modules/browser-automation/` directory SHALL remain absent after surviving errors, types, auth helpers, and stores move under browser-owned module boundaries.

#### Scenario: Browser behavior is registered
- **WHEN** the backend application starts
- **THEN** it imports browser auth, content, sites, and desktop runtime modules directly instead of importing `BrowserAutomationModule`

#### Scenario: Browser automation directory is absent
- **WHEN** backend source files are checked after migration
- **THEN** no code imports from `apps/backend/src/modules/browser-automation/` or from relative `browser-automation` paths

#### Scenario: Surviving shared code has browser-owned paths
- **WHEN** browser errors, content types, auth bundle helpers, or auth state stores remain necessary
- **THEN** they live under `apps/backend/src/modules/browser/shared`, `apps/backend/src/modules/browser/content`, or `apps/backend/src/modules/browser/auth`
