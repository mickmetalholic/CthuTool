# apps-backend-browser-agent-capture Specification

## Purpose
TBD - created by archiving change apps-backend-browser-agent-capture-module. Update Purpose after archive.
## Requirements
### Requirement: Browser agent capture capability retired
The backend SHALL NOT expose browser capture as an agent-named module capability; browser capture execution MUST be owned by `apps-backend-desktop-browser-runtime`.

#### Scenario: Capture execution is requested
- **WHEN** backend browser content or auth workflows need desktop browser capture
- **THEN** they use `desktop-browser-runtime` instead of `BrowserAgentCaptureModule`

