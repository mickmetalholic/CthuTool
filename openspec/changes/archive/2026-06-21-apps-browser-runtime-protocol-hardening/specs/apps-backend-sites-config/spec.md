## MODIFIED Requirements

### Requirement: Sites config consumer compatibility
The backend SHALL keep internal effective site configuration behavior compatible while deleting the separate `BrowserSitesModule` boundary and the `/api/browser/sites` compatibility route.

#### Scenario: Browser sites API is removed
- **WHEN** a client calls the removed `/api/browser/sites` compatibility route
- **THEN** the backend does not serve site configuration through that route

#### Scenario: Browser modules import sites config
- **WHEN** `BrowserService`, browser content internals, browser auth internals, desktop browser runtime, or browser-facing routes need site configuration
- **THEN** they consume `SitesConfigService` from the sites config module rather than registering their own site config provider

#### Scenario: Browser automation module is absent
- **WHEN** backend browser modules are compiled
- **THEN** site config behavior does not require a standalone `BrowserAutomationModule`

## ADDED Requirements

### Requirement: Browser sites module is removed
The backend SHALL NOT keep `BrowserSitesModule` or `/api/browser/sites` when they only expose effective site configuration.

#### Scenario: Backend module graph is compiled
- **WHEN** the backend application registers modules
- **THEN** it imports `SitesConfigModule` for internal site configuration behavior instead of importing `BrowserSitesModule`

#### Scenario: Browser sites source files are checked
- **WHEN** backend source files are checked after migration
- **THEN** `apps/backend/src/modules/browser/sites/` does not contain a standalone browser sites module boundary

#### Scenario: Browser sites route is absent
- **WHEN** backend routes are checked after migration
- **THEN** no controller registers `/api/browser/sites`
