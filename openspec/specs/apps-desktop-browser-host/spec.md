# apps-desktop-browser-host Specification

## Purpose
TBD - created by archiving change apps-browser-agent-auth. Update Purpose after archive.
## Requirements
### Requirement: Desktop browser capability
CthuDesktop SHALL advertise a browser capability after it can receive controlled browser commands from the backend and execute them through its local Playwright host.

#### Scenario: Browser capability is advertised
- **WHEN** CthuDesktop starts with browser host support enabled
- **THEN** its agent registration includes a browser capability that backend agent selection can use

#### Scenario: Browser capability is not advertised before readiness
- **WHEN** CthuDesktop cannot initialize the browser host or profile store
- **THEN** its agent registration does not advertise browser capability

### Requirement: Controlled browser command handling
CthuDesktop SHALL handle only structured browser commands from the backend and SHALL NOT execute arbitrary Playwright scripts received over the agent connection.

#### Scenario: Capture page command
- **WHEN** CthuDesktop receives a `browser.capturePage` command for a configured site and valid URL
- **THEN** it opens the page with the requested profile or anonymous context, captures only requested fields, and returns a correlated result

#### Scenario: Unknown browser command
- **WHEN** CthuDesktop receives an unsupported browser command type
- **THEN** it returns a structured command error without executing browser work

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
- **THEN** CthuDesktop reports the profile as missing and creates or updates a pending auth task

#### Scenario: Raw profile data remains local
- **WHEN** CthuDesktop reports profile status to the backend
- **THEN** it does not include raw cookies, localStorage values, storage-state contents, or profile directory paths

### Requirement: Desktop login and verification flow
CthuDesktop SHALL provide a user-driven login and verification flow for required-auth site profiles.

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

### Requirement: Desktop browser state projection
CthuDesktop SHALL publish non-sensitive local browser state snapshots to the backend over the agent WebSocket after connection and after local profile or pending-auth state changes.

#### Scenario: Agent connects with local browser state
- **WHEN** CthuDesktop is registered with the backend and its browser host is ready
- **THEN** it publishes a `browser.stateSnapshot` message containing local profile summaries and pending auth tasks without including cookies, storage-state contents, localStorage values, or profile paths

#### Scenario: Local browser state changes
- **WHEN** profile verification, login expiry detection, login window auto-verification, or profile clearing changes local browser state
- **THEN** CthuDesktop publishes an updated `browser.stateSnapshot` message over the active agent WebSocket connection

#### Scenario: Backend reconnect succeeds
- **WHEN** CthuDesktop reconnects to the backend after a backend restart or network interruption
- **THEN** it sends a fresh full browser state snapshot after successful registration acknowledgement

#### Scenario: Agent WebSocket is unavailable
- **WHEN** local browser state changes while CthuDesktop is disconnected from the backend
- **THEN** CthuDesktop keeps the local state and sends the latest full snapshot after the next successful registration

#### Scenario: Raw profile data remains local
- **WHEN** CthuDesktop reports browser state to the backend
- **THEN** it does not include raw cookies, localStorage values, storage-state contents, or profile directory paths

### Requirement: Pending auth task UI
CthuDesktop SHALL display pending auth tasks generated from local preflight, backend requests, or runtime failures.

#### Scenario: Local preflight finds missing required profile
- **WHEN** CthuDesktop loads backend site configuration and a required site has no verified local profile
- **THEN** it displays a pending auth task for that site profile

#### Scenario: Backend requests missing auth
- **WHEN** the backend sends or exposes a pending auth task for a required profile
- **THEN** CthuDesktop displays or updates the matching pending auth task without creating duplicates

#### Scenario: Runtime failure expires profile
- **WHEN** browser access with a verified profile reaches a login page or receives an expired-auth detection
- **THEN** CthuDesktop marks the profile `expired`, stops using it for required tasks, and displays a re-login pending auth task

### Requirement: Anonymous browser access
CthuDesktop SHALL use isolated temporary browser contexts for anonymous site access.

#### Scenario: Anonymous site capture
- **WHEN** CthuDesktop receives a capture command for an anonymous site
- **THEN** it uses a temporary context that is not backed by a required-auth persistent profile

#### Scenario: Anonymous access does not create profile
- **WHEN** anonymous site capture completes
- **THEN** CthuDesktop does not create or modify a persistent site profile

### Requirement: Browser execution limits
CthuDesktop SHALL enforce browser task timeout, concurrency, payload size, and resource-blocking controls for commands received from the backend.

#### Scenario: Browser command times out
- **WHEN** a browser command exceeds its configured timeout
- **THEN** CthuDesktop stops the command and returns a structured timeout error

#### Scenario: Resource blocking is applied
- **WHEN** a capture command declares resource types to block
- **THEN** CthuDesktop blocks those resource types during navigation

#### Scenario: Large artifacts are bounded
- **WHEN** captured HTML or screenshot data exceeds configured response limits
- **THEN** CthuDesktop returns a structured size-limit result or diagnostic reference rather than an unbounded WebSocket payload

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

### Requirement: Site-specific browser profile verification
CthuDesktop SHALL support site-specific browser profile verifiers for required-auth profiles while preserving a generic verification fallback for sites without a dedicated verifier.

#### Scenario: Dedicated verifier is selected
- **WHEN** CthuDesktop verifies a required-auth profile whose `siteId` has a registered verifier
- **THEN** it runs the registered verifier instead of relying only on generic login text detection

#### Scenario: Generic verifier is preserved
- **WHEN** CthuDesktop verifies a required-auth profile whose `siteId` has no registered verifier
- **THEN** it uses the existing generic verification behavior

#### Scenario: Dedicated verifier does not expose raw auth state
- **WHEN** a dedicated verifier reports a verified profile
- **THEN** CthuDesktop includes only public profile fields such as status, display name, external user id, and verification timestamps in backend reports

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
- **THEN** CthuDesktop marks the verification result as blocked and keeps or creates a pending auth task instead of marking the profile verified

#### Scenario: Douban account menu succeeds but mine detail is unavailable
- **WHEN** the Douban account menu confirms login but the mine page does not resolve to a current-user `/people/<externalUserId>/` URL
- **THEN** CthuDesktop still marks the profile `verified` with the display name and without an external user id

### Requirement: Douban login status display
CthuDesktop SHALL display Douban login status in its browser/auth UI using public profile summaries and pending auth tasks.

#### Scenario: Douban verified account is shown
- **WHEN** the browser status data contains a verified `douban` profile with a display name
- **THEN** the Desktop UI shows Douban as verified and displays the account display name

#### Scenario: Douban user id is shown when available
- **WHEN** the browser status data contains a verified `douban` profile with an external user id
- **THEN** the Desktop UI displays that external user id with the Douban account status

#### Scenario: Douban pending login is shown
- **WHEN** no verified `douban` profile exists and a pending auth task exists for the Douban profile
- **THEN** the Desktop UI shows that Douban requires login and displays the pending reason

#### Scenario: Douban status uses public state only
- **WHEN** the Desktop UI renders Douban login status
- **THEN** it uses public profile summaries and pending auth task summaries without reading cookies, localStorage, storage-state contents, or local profile directory internals
