## ADDED Requirements

### Requirement: Desktop host Chrome runtime
CthuDesktop SHALL use the host Google Chrome binary for local browser automation.

#### Scenario: Host Chrome is available
- **WHEN** CthuDesktop initializes the browser host with the default browser runtime configuration and host Google Chrome can be launched
- **THEN** CthuDesktop uses host Google Chrome as the browser executable for browser commands

#### Scenario: Host Chrome is unavailable
- **WHEN** CthuDesktop initializes the browser host and host Google Chrome cannot be launched
- **THEN** CthuDesktop does not advertise the `browser` capability and exposes a local diagnostic that explains the missing host Chrome runtime

#### Scenario: Removed Chromium runtime config
- **WHEN** a desktop config file still contains the removed Playwright Chromium runtime kind
- **THEN** CthuDesktop normalizes browser runtime configuration back to host Chrome

#### Scenario: Explicit host Chrome executable path
- **WHEN** desktop configuration selects host Chrome with an explicit executable path
- **THEN** CthuDesktop uses that executable path for host Chrome launch validation and browser command execution

### Requirement: CthuDesktop-owned browser profiles
CthuDesktop SHALL keep required-auth persistent profiles under CthuDesktop app data.

#### Scenario: Required profile with host Chrome runtime
- **WHEN** CthuDesktop opens a required-auth login or capture context using host Google Chrome
- **THEN** it uses the site's persistent profile directory under CthuDesktop app data instead of the user's default Chrome profile

#### Scenario: Profile ownership is independent of Chrome executable
- **WHEN** a user uses auto-discovered host Chrome or an explicit Chrome executable path
- **THEN** CthuDesktop does not migrate profile data into or out of the user's default Chrome profile
