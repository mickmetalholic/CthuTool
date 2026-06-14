## 1. Verifier Foundation

- [x] 1.1 Define a desktop-side profile verifier result shape that maps to existing profile status, display name, external user id, detection, and pending-auth behavior.
- [x] 1.2 Add a verifier registry keyed by `siteId` and wire `PlaywrightHost.verifyProfile()` to prefer registered verifiers before generic detection.
- [x] 1.3 Keep the existing generic verifier path available for sites without a dedicated verifier.

## 2. Douban Verifier

- [x] 2.1 Implement a Douban verifier that opens `https://www.douban.com/` in the persistent profile context and detects the account settings link.
- [x] 2.2 Extract `displayName` from account menu text shaped like `<displayName>的账号`.
- [x] 2.3 Classify missing account-menu signal as `login_required` unless blocked/captcha/rate-limit signals are present.
- [x] 2.4 Open `https://www.douban.com/mine/` after account-menu verification and extract `externalUserId` from final `/people/<id>/` URL when available.
- [x] 2.5 Treat account-menu success with missing `/mine/` user id as verified with partial metadata rather than a failed verification.

## 3. Profile State And Reporting

- [x] 3.1 Persist Douban verifier metadata through `BrowserProfileStore` using existing public fields.
- [x] 3.2 Ensure verified Douban profiles resolve matching pending auth tasks locally.
- [x] 3.3 Ensure desktop state projection reports only public profile metadata to backend APIs.

## 4. Tests

- [x] 4.1 Add unit tests for Douban account-menu success with display name extraction.
- [x] 4.2 Add unit tests for `/mine/` final URL user id extraction.
- [x] 4.3 Add unit tests for missing account-menu, captcha/blocked, and partial-metadata outcomes.
- [x] 4.4 Add regression tests proving non-Douban verification still uses the generic fallback.
- [x] 4.5 Add renderer tests for verified Douban display name, external user id, pending login reason, and refresh after browser actions.

## 5. Desktop UI

- [x] 5.1 Update the Browser/Auth UI to summarize Douban profile status from public browser status data.
- [x] 5.2 Display verified Douban `displayName`, `externalUserId` when present, and `verifiedAt` in the site row or profile detail area.
- [x] 5.3 Display Douban pending auth reason when no verified profile exists.
- [x] 5.4 Keep existing Open Login, Verify, and Clear actions available for the Douban site.

## 6. Verification

- [x] 6.1 Run focused desktop tests for Playwright host, profile store, and renderer browser status behavior.
- [x] 6.2 Run desktop typecheck.
- [x] 6.3 Run backend browser automation tests if profile reporting contracts are touched.
- [x] 6.4 Run `openspec validate apps-desktop-douban-auth-verifier --type change --strict`.
