## 1. Navigation and Workspace Scope

- [x] 1.1 Remove the top-level Tasks navigation item and related activity-bar badge behavior from the desktop renderer.
- [x] 1.2 Rename the Browser Profiles navigation/page label to Browser Host while preserving existing browser action behavior.
- [x] 1.3 Remove the Douban Movie lookup panel and lookup state from the Home workspace without changing backend Douban APIs.

## 2. Home Readiness Dashboard

- [x] 2.1 Replace the current generic Overview content with readiness sections for backend connection, local agent identity/status, online agents summary, browser runtime readiness, and browser-auth attention.
- [x] 2.2 Keep backend URL editing, local paths, detailed runtime diagnostics, and app metadata in Settings rather than duplicating them as Home controls.
- [x] 2.3 Link or direct browser-auth attention from Home to Browser Host for resolution.

## 3. Browser Host Management

- [x] 3.1 Reframe the browser page content around host browser capability, including runtime readiness and managed profile status.
- [x] 3.2 Display pending browser-auth attention in Browser Host using backend browser status plus local pending-auth state.
- [x] 3.3 Preserve explicit Open Login, Verify, and Clear actions for required-auth site profiles.
- [x] 3.4 Preserve recoverable browser status and browser action error feedback.

## 4. Settings Logs Placeholder

- [x] 4.1 Keep Settings Logs accessible but replace synthetic timestamp content with an explicit placeholder that says log viewing is not connected yet.
- [x] 4.2 Do not add server log retrieval, local log streaming, or new IPC/API contracts in this change.

## 5. Tests and Validation

- [x] 5.1 Update renderer tests to assert the absence of the Tasks primary navigation entry.
- [x] 5.2 Update renderer tests for Home readiness content, Browser Host navigation/content, and preserved browser auth actions.
- [x] 5.3 Update renderer tests to assert Douban Movie lookup is not rendered on Home.
- [x] 5.4 Run `pnpm --filter @cthutool/desktop test`.
- [x] 5.5 Run `pnpm --filter @cthutool/desktop typecheck`.
- [x] 5.6 Run `pnpm --filter @cthutool/desktop build`.
