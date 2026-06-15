## MODIFIED Requirements

### Requirement: Desktop login and verification flow
CthuDesktop SHALL provide a user-driven login and verification flow for required-auth site profiles while keeping only interactive login windows visible to the user.

#### Scenario: User starts login
- **WHEN** the user starts login for a pending required site profile
- **THEN** CthuDesktop opens a headed browser window at the site's configured login URL using that profile's persistent context

#### Scenario: User verifies login
- **WHEN** the user requests verification after completing login
- **THEN** CthuDesktop navigates to the configured verification URL, determines profile status, and reports a public profile summary to the backend

#### Scenario: Login verification succeeds
- **WHEN** verification confirms the user is logged in
- **THEN** CthuDesktop marks the profile `verified`, resolves matching pending auth tasks, and reports the verified profile to the backend

#### Scenario: Login window closes after user login
- **WHEN** the user closes a headed login browser window for a required site profile
- **THEN** CthuDesktop automatically verifies the profile using the configured verification URL and updates local profile and pending auth state

#### Scenario: Login verification fails
- **WHEN** verification cannot confirm logged-in status
- **THEN** CthuDesktop marks the profile `login_required` or `blocked` and keeps a pending auth task open

### Requirement: Browser launch visibility
CthuDesktop SHALL run non-interactive browser automation without showing a Chrome window while preserving headed windows for user-driven login.

#### Scenario: Capture page is hidden
- **WHEN** CthuDesktop executes a `browser.capturePage` command for a required-auth or anonymous site
- **THEN** it launches the browser context in hidden/headless mode and returns the requested bounded capture result

#### Scenario: Verification is hidden
- **WHEN** CthuDesktop executes a `browser.verifyProfile` command outside an active login window
- **THEN** it performs verification in hidden/headless mode and reports only public profile status

#### Scenario: Login remains visible
- **WHEN** CthuDesktop executes a `browser.openLogin` command
- **THEN** it opens a headed browser window so the user can complete manual login

#### Scenario: Hidden capture does not bypass access controls
- **WHEN** hidden browser execution encounters login-required, captcha, abnormal access, rate limiting, or blocked content
- **THEN** CthuDesktop returns the structured detection state instead of automatically switching to a visible window or attempting to bypass the restriction
