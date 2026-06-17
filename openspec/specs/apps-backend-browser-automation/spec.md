## Purpose
Define backend-owned browser automation services, browser auth profiles, controlled diagnostics, and CLI auth helper behavior for internal page content retrieval.
## Requirements
### Requirement: Browser automation composition module retired
The backend SHALL NOT expose `BrowserAutomationModule` as a standalone browser domain or composition module; browser-facing routes and services MUST be owned by their browser capability modules.

#### Scenario: Browser behavior is registered
- **WHEN** the backend application starts
- **THEN** it imports browser auth, content, sites, and desktop runtime modules directly instead of importing `BrowserAutomationModule`
