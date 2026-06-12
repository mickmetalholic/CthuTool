## 1. Configuration and Runtime Boundaries

- [x] 1.1 Add backend browser automation configuration for provider, headless mode, data directories, auth-state directory, diagnostics directory, max concurrency, default timeout, and default delay.
- [x] 1.2 Update backend configuration tests for valid browser settings, defaults, and invalid values.
- [x] 1.3 Add ignored runtime paths for browser data, browser auth state, and browser diagnostics.
- [x] 1.4 Add Playwright dependency and any required package scripts or setup notes for backend and CLI usage.

## 2. Browser Automation Module

- [x] 2.1 Create `BrowserAutomationModule` under `apps/backend/src/modules/browser-automation`.
- [x] 2.2 Define request, result, auth metadata, detection, diagnostics, and error types for browser content retrieval.
- [x] 2.3 Implement `BrowserContentService.getPageContent()` as the only exported content retrieval entrypoint.
- [x] 2.4 Implement allowed-origin validation that fails before navigation when a request URL is outside the request allowlist.
- [x] 2.5 Implement `BrowserTaskRunner` with max concurrency, timeout handling, retry boundaries, and default delay support.

## 3. Local Playwright Provider

- [x] 3.1 Define the internal `BrowserProvider` interface used by `BrowserContentService`.
- [x] 3.2 Implement `LocalPlaywrightProvider` with isolated context creation, navigation, title capture, optional HTML/text capture, and resource cleanup.
- [x] 3.3 Apply request-level resource blocking for supported resource types.
- [x] 3.4 Ensure browser resources close on success, timeout, block detection, and thrown errors.

## 4. Auth Profiles and Bundles

- [x] 4.1 Define the Playwright-compatible auth bundle format with `storage-state.json` and `meta.json`.
- [x] 4.2 Implement `BrowserAuthStateStore` for profile existence checks, reads, writes, clears, status metadata, and validation.
- [x] 4.3 Ensure `requireAuth: true` fails with `AUTH_STATE_MISSING` before navigation when the profile is absent.
- [x] 4.4 Ensure optional auth profiles fall back to anonymous navigation when missing and report auth usage accurately.
- [x] 4.5 Prevent service results and status responses from exposing raw cookies, localStorage, or storage-state contents.

## 5. Detection and Diagnostics

- [x] 5.1 Implement `BrowserBlockDetector` for `ok`, `login_required`, `rate_limited`, `captcha_required`, and `blocked` results based on status, final URL, title, and text patterns.
- [x] 5.2 Ensure captcha and block detections stop automation without captcha solving or repeated retry loops.
- [x] 5.3 Implement `BrowserDiagnosticsStore` for failure metadata and configured artifacts under the diagnostics directory.
- [x] 5.4 Return diagnostics identifiers and summaries without returning raw diagnostic artifacts inline.

## 6. CLI Auth Helper

- [x] 6.1 Add a `chc browser auth login <profile>` command that opens a headed local Playwright browser for manual login.
- [x] 6.2 Export storage state and metadata after user confirmation without asking for or storing account passwords.
- [x] 6.3 Support writing the auth bundle to a local output directory.
- [x] 6.4 Decide and implement either direct backend upload or documented file placement for first-version backend consumption.
- [x] 6.5 Add CLI tests for argument parsing, output path handling, metadata creation, and password-free behavior using mocked Playwright primitives.
- [x] 6.6 Document explicit `chc browser doctor` and `chc browser install` usage instead of installing browsers from package hooks.
- [x] 6.7 Add `chc browser doctor` and `chc browser install` commands with tests and shell completion coverage.
- [x] 6.8 Add `chc browser auth verify <profile>` for minimal Douban user id and nickname verification.

## 7. Extension Compatibility Contract

- [x] 7.1 Document the frontend-plus-browser-extension auth flow as a producer of the same backend auth bundle format.
- [x] 7.2 Add validation tests showing extension-shaped cookie and origin storage input is accepted only after conversion to the shared bundle format.
- [x] 7.3 Ensure the frontend role is limited to status display and extension coordination, not direct third-party cookie or localStorage reads.

## 8. Verification

- [x] 8.1 Add backend unit tests for content result shaping, origin allowlist failures, auth-state behavior, task runner concurrency, block detection, and diagnostics.
- [x] 8.2 Add provider tests with mocked Playwright behavior for navigation success, timeout, resource blocking, and cleanup.
- [x] 8.3 Run `pnpm --filter @cthutool/backend test`.
- [x] 8.4 Run `pnpm --filter @cthutool/backend build` or the repo-standard backend type/build check.
- [x] 8.5 Run the relevant CLI tests for the auth helper.
- [x] 8.6 Run `openspec status --change "apps-backend-browser-automation" --json` and confirm all implementation tasks are complete before archive.
