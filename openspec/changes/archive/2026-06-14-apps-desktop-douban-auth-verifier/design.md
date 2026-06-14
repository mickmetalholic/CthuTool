## Context

CthuDesktop currently verifies required-auth browser profiles with a generic page detector that checks final URL and body text for login, captcha, or rate-limit signals. That is useful as a fallback, but Douban has stable first-party page signals that can make profile verification more reliable and can populate public profile identity without reading cookies or storage.

Authenticated Chrome inspection showed two useful Douban behaviors:

- `https://www.douban.com/` includes a top navigation account link pointing to `https://accounts.douban.com/passport/setting/` with text shaped like `<displayName>的账号`.
- `https://www.douban.com/mine/` resolves to the current user's profile page, whose final URL is shaped like `https://www.douban.com/people/<externalUserId>/`.

The desktop browser host owns raw browser state. Backend only receives public profile summaries and pending auth state projections.

## Goals / Non-Goals

**Goals:**

- Add a site-specific verifier path for Douban profile verification.
- Use the Douban home account menu as the logged-in existence signal.
- Use `/mine/` profile resolution to populate `externalUserId` when available.
- Display Douban's verified account identity and pending-login state in the Desktop browser/auth UI.
- Keep generic verification as the fallback for non-Douban sites and unexpected Douban page structures.
- Keep raw cookies, localStorage, storage-state contents, and profile paths out of backend reports.

**Non-Goals:**

- Do not scrape cookies, localStorage, or account settings pages.
- Do not automate captcha or abnormal-access challenges.
- Do not add a generalized scripting surface that allows backend to send arbitrary verifier code.
- Do not add new agent protocol fields unless implementation discovers an unavoidable contract gap.
- Do not verify all Douban subdomains in this change; the target is the required-auth `douban` profile configured by backend.

## Decisions

### Site-specific verifier registry

Introduce a small desktop-side verifier registry keyed by `siteId`. `PlaywrightHost.verifyProfile()` asks the registry for a verifier before using the generic detector. The verifier receives the persistent context and command metadata, controls only its own bounded navigation sequence, and returns a normalized verification result.

Alternatives considered:

- Keep adding generic heuristics to `detectAccessProblem`. This is simpler but mixes site-specific DOM knowledge into fallback logic and still cannot reliably extract Douban identity.
- Let backend send verifier scripts. This is more flexible but conflicts with the controlled-command boundary and would create an unsafe browser automation surface.

### Douban verifier uses home first, then mine

The Douban verifier first opens `https://www.douban.com/` and checks for the account link whose href contains `accounts.douban.com/passport/setting` and whose text ends with `的账号`. If it is absent and a login form or login URL is visible, the verifier returns `login_required`. If captcha or abnormal-access text is visible, it returns `blocked`.

When the account link is present, the verifier extracts `displayName` by trimming the `的账号` suffix. It then opens `https://www.douban.com/mine/` and extracts `externalUserId` if the final URL matches `/people/<id>/`. The account-link signal alone is enough to mark the profile verified; `/mine/` enriches the public summary.

Alternatives considered:

- Use `/mine/` only. This is strong for user id, but starting with home gives a cheap stable logged-in signal and a display name even if `/mine/` is slow or partially unavailable.
- Read cookies. Cookie presence does not prove server-side validity and would violate the raw-auth-state boundary.

### Verification result maps to existing profile summary fields

The implementation should reuse `displayName`, `externalUserId`, `status`, `verifiedAt`, and `updatedAt` already present in `BrowserProfileSummary`. No new profile URL field is required for this change.

### Desktop UI uses public summaries only

The Desktop UI should render Douban login state from the same browser status data it already loads from backend and local pending-auth APIs. For the Douban site row, the UI should prefer a matching public profile summary for `siteId: douban` and the configured profile name. If the summary is verified, show the status, display name, external user id when present, and last verified timestamp. If no verified profile exists but a pending auth task exists, show the pending reason and keep login actions visible.

Alternatives considered:

- Add a separate Douban-specific UI endpoint. This would duplicate existing status APIs and make the UI more coupled to one site.
- Read local profile metadata directly from the renderer. That would bypass the existing state projection boundary and make future remote-client mode harder.

## Risks / Trade-offs

- Douban may change DOM structure -> keep the generic fallback and cover selectors with focused unit tests using representative HTML fixtures.
- `/mine/` may be slower or temporarily blocked -> account-link success still verifies the profile, while missing `externalUserId` is treated as partial enrichment rather than a failed login.
- Captcha or abnormal-access pages may contain account-like text -> classify captcha and abnormal-access signals before accepting the account-link result where possible.
- Additional navigation adds small overhead -> only run the two-step verifier during explicit verify or login-window auto-verify, not on every capture command.
- UI may briefly show stale backend state before desktop resyncs -> continue to display pending actions and refresh after verify/open/clear actions complete.

## Migration Plan

Implement the verifier behind the existing `browser.verifyProfile` command. Existing profiles continue to work; the next Douban verification updates their public metadata. Rollback is straightforward: remove the Douban verifier registration and `PlaywrightHost.verifyProfile()` will fall back to the current generic detector.
