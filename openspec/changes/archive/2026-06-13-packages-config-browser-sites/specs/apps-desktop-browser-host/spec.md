## ADDED Requirements

### Requirement: Backend-owned site config consumption
CthuDesktop SHALL consume effective browser site configuration through backend APIs and SHALL NOT read backend browser site JSON files directly.

#### Scenario: Desktop displays effective backend sites
- **WHEN** CthuDesktop loads browser site configuration for its browser management UI
- **THEN** it reads `/api/browser/sites` from the configured backend and displays the effective site definitions returned by backend

#### Scenario: Desktop starts login from backend site config
- **WHEN** a user starts login for a required site shown in CthuDesktop
- **THEN** CthuDesktop uses the login URL, verification URL, site id, and profile name returned by backend APIs

#### Scenario: Desktop does not own site JSON
- **WHEN** backend browser site JSON is changed or mounted differently
- **THEN** CthuDesktop observes the change only through backend API responses and does not attempt to read, validate, or merge the JSON file locally
