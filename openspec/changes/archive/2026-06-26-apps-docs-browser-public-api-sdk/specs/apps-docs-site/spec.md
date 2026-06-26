## MODIFIED Requirements

### Requirement: Module usage documentation
The docs site SHALL provide module-oriented usage documentation for major CthuTool product areas.

#### Scenario: Reader chooses browser integration
- **WHEN** a reader opens browser automation or browser client module documentation
- **THEN** the documentation explains the backend public browser session API, `@cthutool/browser-client` SDK, supported session lifecycle, supported page methods, and trusted deployment assumptions

#### Scenario: Module source boundaries are visible
- **WHEN** a module page summarizes public browser API or SDK behavior owned by package README or OpenSpec specs
- **THEN** the page identifies the authoritative source path for development or requirements details

### Requirement: Architecture documentation with OpenSpec references
The docs site SHALL explain the implementation architecture while preserving OpenSpec specs as the authoritative requirements source.

#### Scenario: Reader reviews browser public API architecture
- **WHEN** a reader opens browser automation, browser auth, or backend API reference docs
- **THEN** the documentation explains that third-party clients call the backend public browser API, the backend routes bounded action lists to one online CthuDesktop agent, and CthuDesktop owns Playwright runtime state

## ADDED Requirements

### Requirement: Browser public API reference documentation
The docs site SHALL document the trusted public browser session API and its safety boundaries.

#### Scenario: Reader finds session endpoints
- **WHEN** a reader opens backend API reference documentation
- **THEN** the docs list session create, run-actions, and close endpoints
- **AND** they explain that the backend stores only routing metadata while desktop owns browser state

#### Scenario: Reader understands browser API limitations
- **WHEN** public browser API docs describe supported actions
- **THEN** they state that the API supports a bounded Playwright-like action DSL and not arbitrary Playwright script execution
- **AND** they state that sensitive browser state is not returned

### Requirement: Browser client SDK documentation
The docs site SHALL document `@cthutool/browser-client` for third-party applications using the backend public browser API.

#### Scenario: Reader uses the SDK
- **WHEN** a reader opens browser client SDK docs
- **THEN** the docs include install/build context, a minimal `CthuBrowserClient` example, session lifecycle, supported page methods, and limitations
