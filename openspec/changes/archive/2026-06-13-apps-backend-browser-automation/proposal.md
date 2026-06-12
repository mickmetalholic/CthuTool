## Why

Backend modules need a shared, controlled way to retrieve browser-rendered page content for sources that are not reliable through plain HTTP alone. Building this as a backend foundation now keeps future Douban, Notion enrichment, and other source adapters from each creating their own Playwright lifecycle, auth-state, retry, and diagnostics behavior.

## What Changes

- Add a backend browser automation capability that exposes an internal service for fetching page content snapshots by URL.
- Introduce a local Playwright-backed provider behind a provider interface so future browser runtimes, such as Steel Cloud, can be added without changing business modules.
- Add browser auth-state storage for named profiles, using Playwright-compatible storage state bundles without storing usernames or passwords.
- Add a basic task runner for concurrency, timeout, retry, origin allowlist, and per-request resource blocking behavior.
- Add block and auth detection results for login-required, rate-limited, captcha-required, blocked, and normal page states.
- Add diagnostics storage for failed or blocked page retrievals, returning diagnostic identifiers rather than exposing raw sensitive artifacts by default.
- Add CLI browser auth commands for installing/checking the local browser runtime, creating auth bundles, and verifying Douban auth with minimal user identity output.
- Add a future frontend-plus-browser-extension auth path that produces the same backend auth bundle format.
- Exclude MCP, Douban movie parsing, Notion database integration, Steel, proxy management, captcha solving, and stealth tooling from this change.

## Capabilities

### New Capabilities

- `apps-backend-browser-automation`: Backend-owned browser automation services, page content retrieval, browser auth profiles, and controlled diagnostics for internal modules.

### Modified Capabilities

- None.

## Impact

- Affected code: `apps/backend` modules, configuration parsing, test setup, and gitignored runtime data paths.
- Affected CLI code: `apps/cli` receives `chc browser install`, `chc browser doctor`, `chc browser auth login <profile>`, and `chc browser auth verify <profile>`.
- New dependencies: Playwright for backend/browser auth helper runtime, plus any test-time mocks needed for provider behavior.
- Runtime data: backend-managed browser auth state and diagnostics under non-repository data/secrets directories. CLI-local `apps/cli/data/` is also ignored for linked-development auth bundles.
- Security: auth-state files must not be committed, returned through public APIs, or exposed to future agent-facing tools.
