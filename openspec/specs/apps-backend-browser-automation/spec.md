# apps-backend-browser-automation Specification

## Purpose
Define backend-owned browser automation services, browser auth profiles, controlled diagnostics, and CLI auth helper behavior for internal page content retrieval.

## Requirements
### Requirement: Browser automation composition module retired
The backend SHALL NOT expose `BrowserAutomationModule` as a standalone browser domain or composition module, and the `apps/backend/src/modules/browser-automation/` directory SHALL be removed after surviving errors, types, auth helpers, and stores move under browser-owned module boundaries.

#### Scenario: Browser behavior is registered
- **WHEN** the backend application starts
- **THEN** it imports browser auth, content, sites, and desktop runtime modules directly instead of importing `BrowserAutomationModule`

#### Scenario: Browser automation directory is absent
- **WHEN** backend source files are checked after migration
- **THEN** no code imports from `apps/backend/src/modules/browser-automation/` or from relative `browser-automation` paths

#### Scenario: Surviving shared code has browser-owned paths
- **WHEN** browser errors, content types, auth bundle helpers, or auth state stores remain necessary
- **THEN** they live under `apps/backend/src/modules/browser/shared`, `apps/backend/src/modules/browser/content`, or `apps/backend/src/modules/browser/auth`
