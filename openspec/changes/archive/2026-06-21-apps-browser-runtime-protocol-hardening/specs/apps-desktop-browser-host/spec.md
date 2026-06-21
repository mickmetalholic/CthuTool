## MODIFIED Requirements

### Requirement: Controlled browser command handling
CthuDesktop SHALL handle only structured browser JSON-RPC runtime commands from the backend and SHALL NOT execute arbitrary Playwright scripts received over the agent connection.

#### Scenario: Capture page command
- **WHEN** CthuDesktop receives a JSON-RPC `browser.capturePage` command for a configured site and valid URL
- **THEN** it opens the page with the requested profile or anonymous context, captures only requested fields, and returns a correlated JSON-RPC success result

#### Scenario: Unknown browser command
- **WHEN** CthuDesktop receives an unsupported browser runtime method
- **THEN** it returns a correlated JSON-RPC error without executing browser work

#### Scenario: Arbitrary script is rejected
- **WHEN** a browser command payload attempts to provide executable script text as the browser task
- **THEN** CthuDesktop rejects the command without evaluating that script

### Requirement: Desktop browser profile store
CthuDesktop SHALL store required-auth site profiles locally using persistent browser profile directories under Electron app data.

#### Scenario: Required profile is present
- **WHEN** a required site profile exists locally and is verified
- **THEN** CthuDesktop can use that persistent profile for browser commands that require the site profile

#### Scenario: Required profile is missing
- **WHEN** a required site profile does not exist locally
- **THEN** CthuDesktop reports the profile as missing through the active browser runtime result or challenge without creating or updating a pending auth task

#### Scenario: Raw profile data remains local
- **WHEN** CthuDesktop reports profile status to the backend
- **THEN** it does not include raw cookies, localStorage values, storage-state contents, or profile directory paths

### Requirement: Desktop login and verification flow
CthuDesktop SHALL provide a user-driven login and verification flow for required-auth site profiles while keeping only interactive login windows visible to the user.

#### Scenario: User starts login
- **WHEN** the user starts login for a required site profile from an active workflow or browser profile surface
- **THEN** CthuDesktop opens a headed browser window at the site's configured login URL using that profile's persistent context

#### Scenario: User verifies login
- **WHEN** the user requests verification after completing login
- **THEN** CthuDesktop navigates to the configured verification URL, determines profile status, and returns a public profile summary through the active browser runtime operation

#### Scenario: Login verification succeeds
- **WHEN** verification confirms the user is logged in
- **THEN** CthuDesktop marks the profile `verified` locally and returns the verified public profile to the caller without resolving any pending auth task

#### Scenario: Login window closes after user login
- **WHEN** the user closes a headed login browser window for a required site profile
- **THEN** CthuDesktop can verify the profile using the configured verification URL and update local profile state without publishing a browser state snapshot

#### Scenario: Login verification fails
- **WHEN** verification cannot confirm logged-in status
- **THEN** CthuDesktop marks the profile `login_required` or `blocked` and returns a structured challenge or verification result without opening a pending auth task

### Requirement: Douban profile verifier
CthuDesktop SHALL verify Douban profiles by using Douban first-party page signals from the persistent browser profile.

#### Scenario: Douban account menu confirms login
- **WHEN** CthuDesktop verifies the `douban` profile and `https://www.douban.com/` contains an account link whose target contains `accounts.douban.com/passport/setting` and whose visible text ends with `的账号`
- **THEN** CthuDesktop marks the profile `verified` and stores the text before `的账号` as the profile display name

#### Scenario: Douban mine page enriches user id
- **WHEN** the Douban account menu confirms login and `https://www.douban.com/mine/` resolves to a final URL matching `https://www.douban.com/people/<externalUserId>/`
- **THEN** CthuDesktop stores `<externalUserId>` in the public profile summary

#### Scenario: Douban account menu missing
- **WHEN** CthuDesktop verifies the `douban` profile and the Douban home page does not expose the account menu signal
- **THEN** CthuDesktop treats the profile as `login_required` unless the page is classified as blocked

#### Scenario: Douban abnormal access is blocked
- **WHEN** CthuDesktop verifies the `douban` profile and the Douban home or mine page indicates captcha, abnormal access verification, or rate limiting
- **THEN** CthuDesktop marks the verification result as blocked and returns a structured browser runtime challenge or detection instead of marking the profile verified

#### Scenario: Douban account menu succeeds but mine detail is unavailable
- **WHEN** the Douban account menu confirms login but the mine page does not resolve to a current-user `/people/<externalUserId>/` URL
- **THEN** CthuDesktop still marks the profile `verified` with the display name and without an external user id

### Requirement: Douban login status display
CthuDesktop SHALL display Douban login status in its browser/auth UI using public profile summaries, explicit runtime status responses, and operation-scoped browser challenges.

#### Scenario: Douban verified account is shown
- **WHEN** the browser status data contains a verified `douban` profile with a display name
- **THEN** the Desktop UI shows Douban as verified and displays the account display name

#### Scenario: Douban user id is shown when available
- **WHEN** the browser status data contains a verified `douban` profile with an external user id
- **THEN** the Desktop UI displays that external user id with the Douban account status

#### Scenario: Douban challenge is shown
- **WHEN** a Douban lookup, status, or verification operation returns a browser runtime challenge for the Douban profile
- **THEN** the Desktop UI shows that Douban requires user action and offers the relevant runtime action without reading pending auth task state

#### Scenario: Douban status uses public state only
- **WHEN** the Desktop UI renders Douban login status
- **THEN** it uses public profile summaries and interaction challenge summaries without reading cookies, localStorage, storage-state contents, local profile directory internals, or pending auth task records

## REMOVED Requirements

### Requirement: Backend-owned site config consumption
**Reason**: Desktop should not depend on the removed `/api/browser/sites` compatibility route for raw effective site configuration.
**Migration**: Desktop browser/profile surfaces use browser facade/status responses that contain only the public site/profile/action data needed for the active workflow.

#### Scenario: Desktop does not fetch browser sites route
- **WHEN** CthuDesktop needs browser profile or login action data
- **THEN** it does not call `/api/browser/sites` and instead uses the new browser status/facade surface

### Requirement: Desktop browser state projection
**Reason**: Backend must not keep mirrored browser profile or pending auth task state, and agent transport must not carry browser-specific state snapshot messages.
**Migration**: Query browser status explicitly through browser runtime/status APIs and return operation-scoped challenges from operations that need user action.

#### Scenario: Browser state snapshot is removed
- **WHEN** desktop browser profile or auth state changes
- **THEN** CthuDesktop does not publish a `browser.stateSnapshot` message over the agent WebSocket

### Requirement: Pending auth task UI
**Reason**: Browser auth is no longer modeled as durable pending tasks in desktop or backend state.
**Migration**: Browser profile surfaces and active workflows render public runtime status and operation-scoped interaction challenges.

#### Scenario: Pending auth task UI is removed
- **WHEN** a required profile is missing, expired, blocked, or needs verification
- **THEN** CthuDesktop exposes the condition through runtime status or an operation challenge instead of displaying a pending auth task row
