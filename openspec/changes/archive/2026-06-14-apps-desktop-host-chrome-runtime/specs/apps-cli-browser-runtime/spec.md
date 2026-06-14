## ADDED Requirements

### Requirement: Browser runtime diagnostics
The CLI SHALL report host Chrome runtime availability for CthuDesktop browser automation.

#### Scenario: Host Chrome is available
- **WHEN** the user runs `chc browser doctor` and host Google Chrome is available
- **THEN** the CLI reports browser runtime setup as ready and identifies host Chrome as the preferred desktop runtime

#### Scenario: Host Chrome is unavailable
- **WHEN** the user runs `chc browser doctor` and host Google Chrome is unavailable
- **THEN** the CLI reports browser runtime setup as incomplete and recommends installing Google Chrome or configuring an executable path

#### Scenario: Playwright is unavailable
- **WHEN** the user runs `chc browser doctor` and the Playwright automation library cannot be loaded
- **THEN** the CLI reports browser runtime setup as incomplete

### Requirement: No browser install command
The CLI SHALL NOT expose a browser install subcommand for CthuDesktop runtime setup.

#### Scenario: Browser runtime setup
- **WHEN** a user needs to set up browser automation
- **THEN** documentation and diagnostics point to installing host Google Chrome rather than running `chc browser install`

### Requirement: Browser runtime status output
The CLI SHALL keep backend browser status separate from local browser runtime diagnostics.

#### Scenario: Browser status reads backend state
- **WHEN** the user runs `chc browser status`
- **THEN** the CLI reports backend browser sites, profile summaries, and pending auth tasks without requiring local host Chrome discovery

#### Scenario: Browser doctor reads local runtime state
- **WHEN** the user needs local host Chrome availability
- **THEN** the user can run `chc browser doctor` instead of `chc browser status`
