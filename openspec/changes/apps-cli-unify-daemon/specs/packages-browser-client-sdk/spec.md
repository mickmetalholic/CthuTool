## MODIFIED Requirements

### Requirement: SDK documentation and examples
The browser client SDK SHALL document installation, configuration, session
lifecycle, supported page methods, and installation from prebuilt fixed-version GitHub Release tarballs without npm publication.

#### Scenario: README includes basic usage
- **WHEN** a developer reads the package README
- **THEN** it includes a minimal example that creates a client, opens a page,
  navigates, extracts content, and closes the page

#### Scenario: README states limitations
- **WHEN** a developer reads the package README
- **THEN** it states that the SDK talks to the CthuTool backend, does not connect
  to Playwright directly, does not expose raw browser storage, and assumes a
  trusted backend deployment until API authentication is added

#### Scenario: External installation is documented
- **WHEN** a developer follows the README in another repository
- **THEN** npm and pnpm fixed-release archive installation examples preserve the @cthutool/browser-client import name without cloning or building the monorepo
- **AND** the documentation explains explicit version/lockfile upgrades and the existing Backend access boundary

#### Scenario: SDK and daemon responsibilities are explained
- **WHEN** a developer compares local Playwright with the remote client
- **THEN** documentation shows SDK to Backend HTTP to daemon WSS to host Chrome, states that Profiles remain on the daemon host, and preserves the controlled API subset and no-arbitrary-evaluation limits
