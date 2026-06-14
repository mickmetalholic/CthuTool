## Why

Douban login verification currently relies on generic URL and page-text heuristics, which can misclassify logged-in pages and cannot reliably populate the public profile identity shown in CthuDesktop and backend status views. Recent authenticated Chrome inspection showed that Douban exposes a stable logged-in account menu on `https://www.douban.com/` and resolves `https://www.douban.com/mine/` to the current user's profile URL, so the desktop browser host can verify Douban profiles with site-specific signals.

## What Changes

- Add a site-specific Douban profile verifier in CthuDesktop's browser host flow.
- Treat the Douban home account menu link, whose text matches `<displayName>的账号` and points at `accounts.douban.com/passport/setting`, as the first logged-in signal.
- Navigate to `https://www.douban.com/mine/` after the account menu signal is found and extract the current user id from the resulting `/people/<id>/` URL when available.
- Save verified Douban profile summaries with `displayName`, `externalUserId`, and `verifiedAt`.
- Show Douban login status in the Desktop browser/auth UI, including verified account display name, external user id when available, last verification time, and pending login state.
- Preserve the existing generic verifier as a fallback for sites without a dedicated verifier.
- Keep raw cookies, localStorage, storage-state contents, and profile paths local to the desktop profile store.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-desktop-browser-host`: refine required-auth profile verification so CthuDesktop can use site-specific verifiers, starting with Douban account-menu and `/mine/` profile resolution.

## Impact

- `apps/desktop/src/main/playwright-host.ts` gains a verifier registry or equivalent site-specific verification path.
- `apps/desktop/src/main/browser-profile-store.ts` may persist additional public metadata already represented by profile summaries.
- `apps/desktop/src/renderer/src/App.tsx` and related browser status API helpers display Douban's public profile summary and pending auth state.
- `packages/agent-protocol` already exposes `displayName` and `externalUserId`, so no protocol field expansion is expected.
- `apps/backend/src/modules/browser-automation` continues to receive only public profile summaries through existing profile reporting APIs.
- Unit tests should cover Douban verified, login-required, blocked, and partial-profile-detail outcomes without contacting live Douban.
