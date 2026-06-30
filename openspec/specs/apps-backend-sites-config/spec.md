# apps-backend-sites-config Specification

## Purpose
Define the backend-owned module and service boundary for effective site configuration loading, override merging, lookup, and browser automation consumer compatibility.

## Requirements
### Requirement: Backend sites config module
The backend SHALL provide a `SitesConfigModule` that owns effective site configuration loading and lookup without depending on browser runtime, agent state, browser command dispatch, profile storage, pending auth tasks, or diagnostics.

#### Scenario: Module loads effective sites
- **WHEN** backend starts with no explicit site config override file
- **THEN** `SitesConfigModule` provides the built-in effective site configuration through `SitesConfigService`

#### Scenario: Module loads override file
- **WHEN** backend starts with an explicit site config override file path
- **THEN** `SitesConfigModule` loads, validates, and merges the override file through the shared config package before exposing effective sites

#### Scenario: Module rejects invalid override
- **WHEN** backend starts with an explicit site config override file that cannot be read or validated
- **THEN** `SitesConfigModule` fails startup with the same structured configuration error behavior as the previous backend site config provider

### Requirement: Neutral sites config service
The backend SHALL expose a neutral `SitesConfigService` for listing sites, retrieving a site by id, and resolving a site by URL origin while preserving the existing effective site data shape.

#### Scenario: Site list is copied
- **WHEN** a backend consumer lists effective sites
- **THEN** `SitesConfigService` returns copied site entries that callers cannot mutate into module state

#### Scenario: Site id resolves
- **WHEN** a backend consumer requests a configured site id
- **THEN** `SitesConfigService` returns the matching effective site configuration

#### Scenario: URL origin resolves
- **WHEN** a backend consumer requests a URL whose origin is included in a configured site
- **THEN** `SitesConfigService` returns the matching effective site configuration

#### Scenario: Unknown URL origin is unresolved
- **WHEN** a backend consumer requests a URL whose origin is not included in any configured site
- **THEN** `SitesConfigService` returns no site rather than dispatching browser work or creating agent state

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
