## ADDED Requirements

### Requirement: Browser service anchors backend browser documentation
The backend browser documentation SHALL identify `BrowserService` as the business-facing aggregate boundary for approved browser workflows, while lower-level runtime, protocol, content, auth, diagnostics, and site-policy details remain in their owning capability specs.

#### Scenario: Capability map lists backend browser workflow owner
- **WHEN** a developer reads the OpenSpec capability map for backend browser workflows
- **THEN** `apps-backend-browser-service` is identified as the aggregate entry point for business-facing browser workflows
- **AND** lower-level runtime or protocol capabilities are listed as supporting boundaries rather than alternate business-module entry points

#### Scenario: Browser internals stay linked to owning specs
- **WHEN** the capability map describes browser content, auth, runtime protocol, public API, or client SDK capabilities
- **THEN** it links those capabilities to their owning specs without moving their requirements into the map
