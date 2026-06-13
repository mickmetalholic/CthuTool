## MODIFIED Requirements

### Requirement: Backend browser site configuration
The backend SHALL load effective browser site configurations from built-in defaults plus an optional validated JSON override file, using the shared config package to map allowed origins to site identifiers, auth policy, login URL, verification URL, default profile name, and detection hints.

#### Scenario: Required site is configured
- **WHEN** a backend module requests browser content for a URL whose origin matches a configured required-auth site
- **THEN** the browser automation module resolves the site id, default profile name, login URL, verification URL, and `required` auth policy from the effective site configuration before dispatching any browser task

#### Scenario: Anonymous site is configured
- **WHEN** a backend module requests browser content for a URL whose origin matches a configured anonymous site
- **THEN** the browser automation module resolves the site id and `anonymous` auth policy from the effective site configuration without requiring any profile

#### Scenario: Unknown site is rejected
- **WHEN** a backend module requests browser content for a URL that does not match any configured site origin
- **THEN** the browser automation module fails before dispatching browser work with a `SITE_NOT_CONFIGURED` error

#### Scenario: JSON override updates built-in site
- **WHEN** backend starts with a browser sites JSON file that overrides a built-in site by `siteId`
- **THEN** `/api/browser/sites` and browser content resolution use the merged site configuration

#### Scenario: JSON override is invalid
- **WHEN** backend starts with an explicit browser sites JSON file that cannot be read or validated
- **THEN** backend startup fails with a configuration error that identifies the file and validation issue

#### Scenario: No JSON override is configured
- **WHEN** backend starts without a browser sites JSON file path
- **THEN** browser automation uses the built-in default site configuration
