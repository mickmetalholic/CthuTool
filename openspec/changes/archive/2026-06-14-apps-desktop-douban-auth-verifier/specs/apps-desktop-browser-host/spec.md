## ADDED Requirements

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
