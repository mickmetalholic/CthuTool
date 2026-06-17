## MODIFIED Requirements

### Requirement: Sites config consumer compatibility
The backend SHALL keep effective site configuration behavior compatible while moving browser-facing site APIs into the browser sites module organization.

#### Scenario: Browser sites API is unchanged
- **WHEN** a client calls the browser sites listing API
- **THEN** the response shape and effective site entries remain compatible with the previous browser automation module behavior

#### Scenario: Browser modules import sites config
- **WHEN** browser content, browser auth, desktop browser runtime, or browser sites routes need site configuration
- **THEN** they consume `SitesConfigService` from the sites config module rather than registering their own site config provider

#### Scenario: Browser automation module is absent
- **WHEN** backend browser modules are compiled
- **THEN** site config behavior does not require a standalone `BrowserAutomationModule`
