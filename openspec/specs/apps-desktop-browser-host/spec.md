# apps-desktop-browser-host Specification

## Purpose
Define CthuDesktop browser host behavior for controlled browser commands, local profiles, login and verification flows, runtime limits, and site-aware browser execution.

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

### Requirement: Browser host protocol correlation
CthuDesktop browser host SHALL consume compatible observability metadata from browser JSON-RPC runtime requests and include compatible metadata in browser JSON-RPC responses.

#### Scenario: Command metadata reaches browser host
- **WHEN** CthuDesktop receives a browser runtime request with observability metadata
- **THEN** the browser host makes that metadata available to local diagnostics without using it to change browser execution permissions

#### Scenario: Error preserves command correlation
- **WHEN** CthuDesktop returns a browser runtime error response
- **THEN** the error response preserves the JSON-RPC id and compatible observability metadata so backend diagnostics can correlate the failure

### Requirement: Browser host command observability
The desktop browser host SHALL emit command lifecycle diagnostics for supported browser runtime methods while preserving the existing controlled-command and access-control behavior.

#### Scenario: Command failure is observable
- **WHEN** a browser runtime request fails because the host is not ready, the request is invalid, or runtime execution fails
- **THEN** the browser host returns the existing structured JSON-RPC error and records a diagnostic event with command id, method, reason code, and safe context

#### Scenario: Access detection is observable
- **WHEN** browser execution detects login-required, captcha, rate-limited, or blocked content
- **THEN** the browser host records the detection kind and safe site/profile context without attempting to bypass the access control
### Requirement: Desktop-owned browser sessions
CthuDesktop SHALL own Playwright browser session state for backend-created
public browser sessions.

#### Scenario: Desktop creates browser session
- **WHEN** CthuDesktop receives a valid browser session creation command
- **THEN** it creates a Playwright context and page for the requested site and
  profile policy, stores them under the session ID, and returns public session
  metadata

#### Scenario: Desktop rejects duplicate session
- **WHEN** CthuDesktop receives a session creation command for a session ID that
  is already active locally
- **THEN** it rejects the command with a structured duplicate-session error

#### Scenario: Desktop closes browser session
- **WHEN** CthuDesktop receives a close command for an active browser session
- **THEN** it closes the Playwright page and context and removes local session
  state

### Requirement: Controlled browser action runner
CthuDesktop SHALL execute only supported structured browser actions for public
browser sessions and SHALL NOT evaluate arbitrary Playwright scripts.

#### Scenario: Supported actions execute in order
- **WHEN** CthuDesktop receives a supported action list for an active session
- **THEN** it executes the actions against that session's page in order and
  returns ordered action results

#### Scenario: Unsupported action is rejected
- **WHEN** CthuDesktop receives an unsupported browser action type
- **THEN** it rejects the command without executing subsequent actions

#### Scenario: Arbitrary script payload is rejected
- **WHEN** a browser action payload attempts to provide executable script text or
  raw Playwright commands
- **THEN** CthuDesktop rejects the command without evaluating that script

### Requirement: Desktop browser session limits
CthuDesktop SHALL enforce local session limits for browser sessions created
through the backend public browser API.

#### Scenario: Session timeout is enforced
- **WHEN** an action command exceeds the session or command timeout
- **THEN** CthuDesktop stops the operation and returns a structured timeout
  error

#### Scenario: Session TTL cleanup
- **WHEN** a local browser session exceeds its expiry time or idle timeout
- **THEN** CthuDesktop closes the Playwright page and context and removes local
  session state

#### Scenario: Sensitive session data remains local
- **WHEN** CthuDesktop returns session metadata or action results
- **THEN** it does not include cookies, localStorage values, Playwright
  storage-state contents, desktop profile paths, or raw Playwright object
  handles
