# packages-config-browser-sites Specification

## Purpose
TBD - created by archiving change packages-config-browser-sites. Update Purpose after archive.
## Requirements
### Requirement: Browser sites JSON schema
The config package SHALL define a versioned browser sites JSON format that represents site identifiers, display names, auth policy, default profile names, allowed origins, login URLs, verification URLs, default timeout, and default resource blocking.

#### Scenario: Required-auth site config is valid
- **WHEN** a browser sites JSON file contains a `required` site with `siteId`, `displayName`, `profileName`, `allowedOrigins`, `loginUrl`, and `verifyUrl`
- **THEN** the config package validates it and returns a typed browser site config

#### Scenario: Anonymous site config is valid
- **WHEN** a browser sites JSON file contains an `anonymous` site with `siteId`, `displayName`, and `allowedOrigins`
- **THEN** the config package validates it without requiring `profileName`, `loginUrl`, or `verifyUrl`

#### Scenario: Invalid site config is rejected
- **WHEN** a browser sites JSON file contains an invalid site id, invalid URL, unsupported auth policy, or duplicate site id
- **THEN** the config package returns a structured validation error that identifies the failing field

### Requirement: Browser sites file loading
The config package SHALL load browser site configuration from JSON files without depending on backend, desktop, CLI, or browser automation runtime modules.

#### Scenario: Config file loads successfully
- **WHEN** a caller provides a readable browser sites JSON file path
- **THEN** the config package parses, validates, normalizes, and returns the file's browser site entries

#### Scenario: Config file cannot be read
- **WHEN** a caller provides a path that does not exist or cannot be read
- **THEN** the config package returns a structured file loading error that includes the path

#### Scenario: Config file has malformed JSON
- **WHEN** a caller provides a browser sites file with malformed JSON
- **THEN** the config package returns a structured parse error without producing partial site configuration

### Requirement: Browser sites merge behavior
The config package SHALL merge built-in browser site defaults with override site entries deterministically by `siteId`.

#### Scenario: Override updates default site
- **WHEN** defaults contain a site and the override file contains the same `siteId`
- **THEN** the config package returns one effective site where override scalar fields replace default scalar fields and override array fields replace default array fields

#### Scenario: Override adds new site
- **WHEN** the override file contains a site id not present in defaults
- **THEN** the config package includes that site in the effective site list

#### Scenario: Effective sites are deterministic
- **WHEN** the config package returns merged browser sites
- **THEN** the result order is deterministic by site id and each returned site is a copy that callers cannot mutate into package state

### Requirement: Sensitive auth data exclusion
The config package SHALL NOT accept cookies, localStorage values, Playwright storage-state contents, browser profile directories, or desktop profile state as browser site configuration.

#### Scenario: Raw auth state appears in JSON
- **WHEN** a browser sites JSON file includes raw cookies, localStorage, storage-state data, or profile directory paths
- **THEN** the config package rejects or ignores those fields and does not expose them in typed browser site config
