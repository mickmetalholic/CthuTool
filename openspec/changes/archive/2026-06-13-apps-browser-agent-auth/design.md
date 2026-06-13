## Context

`apps/backend` currently contains a `browser-automation` module with a local Playwright provider and backend-stored auth bundles. That made sense before the desktop app existed, but it conflicts with the current direction: browser activity should happen on a connected CthuDesktop agent, using local machine state and user-visible login flows.

The desktop app already connects to the backend as an agent and is intended to host future local capabilities. Browser access is the first such capability. Frontend, MCP, and CLI consumers should continue to call backend APIs; they should not connect to desktop agents directly or handle cookies.

## Goals / Non-Goals

**Goals:**

- Make backend `browser-automation` an orchestration layer that dispatches controlled browser commands to desktop agents.
- Remove backend-local Playwright as a supported provider path.
- Keep raw browser profiles, cookies, localStorage, and storage-state contents on the desktop machine only.
- Let backend own site configuration, auth policy, origin allowlists, pending auth task coordination, and business-facing browser content APIs.
- Let desktop own Playwright execution, persistent browser profiles, login windows, verification, and local pending task UI.
- Make CLI browser/auth commands inspect backend state only; login happens in CthuDesktop.

**Non-Goals:**

- No remote arbitrary Playwright script execution.
- No automatic captcha solving, anti-bot bypass, or credential automation.
- No backend storage of third-party website cookies or browser storage.
- No direct desktop-to-desktop browser task routing in this change.
- No movie-specific parsing or Douban data model in this change.

## Decisions

### Backend browser automation becomes agent orchestration

`BrowserContentService` remains the internal backend entry point, but its provider becomes agent-backed. A new agent browser provider selects an online desktop agent with `browser` capability, validates site policy, dispatches a command over the agent WebSocket, and maps the response into the existing content result shape.

Alternative considered: keep `LocalPlaywrightProvider` as dev fallback. Rejected because it preserves two runtime ownership models, keeps auth-state code alive in backend, and makes production behavior diverge from the desktop-agent architecture.

### Site configuration is backend-owned

The backend defines browser site configs with `siteId`, `origins`, `authPolicy`, `loginUrl`, `verifyUrl`, and `defaultProfileName`. `authPolicy` is limited to `anonymous` or `required`. There is no `optional` policy because optional auth makes content completeness ambiguous.

Desktop pulls site config from the backend and combines it with local profile state to display readiness and pending login work.

### Login state is desktop-owned

CthuDesktop stores browser profiles under Electron app data and uses Playwright persistent contexts for required-auth sites. Profile metadata may include `siteId`, `profileName`, `status`, `displayName`, `externalUserId`, and timestamps, but raw cookies and storage are never uploaded to backend. CthuDesktop is the source of truth for local profile status; backend profile and pending-auth records are a non-sensitive projection used for orchestration and global UI state.

When a required profile is missing, expired, or verification fails, desktop marks local state accordingly and exposes a pending auth task. Backend may also create a pending auth task when a requested required profile is unavailable.

### Connection sync publishes a desktop-owned state projection

After a desktop agent is registered, CthuDesktop publishes a snapshot of local browser profile summaries and pending auth tasks to backend APIs. The backend keeps the agent connection state and the latest reported projection so backend modules, CLI status, MCP tools, and the desktop console can see which agents appear ready. The backend projection is advisory: actual browser access still executes on the desktop, and runtime failures can mark the desktop-owned profile expired.

Login windows are user-driven. When the user closes a login browser window, CthuDesktop automatically verifies the profile with the configured verification URL, updates local metadata, resolves or keeps pending tasks, and publishes the updated projection.

### Agent protocol exposes controlled browser commands

The shared agent protocol gains structured browser commands such as `browser.capturePage`, `browser.verifyProfile`, `browser.openLogin`, and `browser.clearProfile`. Commands carry site/profile IDs and capture options, not arbitrary code. Results include final URL, status, title, requested content fields, detection state, and profile status metadata.

### CLI auth flow is removed from ownership path

CLI commands must not open login browsers, export storage state, upload auth bundles, or verify third-party account identity by reading local browser state. CLI may list backend site configs, profile summaries, connected agents, and pending auth tasks for automation or troubleshooting.

## Risks / Trade-offs

- Desktop agent unavailable -> Backend returns `AGENT_NOT_AVAILABLE` and records pending work where applicable.
- Login state expires during a task -> Desktop marks the profile `expired`, stops using it, and reports `AUTH_PROFILE_EXPIRED` or `login_required`.
- User surprise from automatic login windows -> Desktop shows pending tasks by default; automatic opening can be an explicit user preference later.
- WebSocket command complexity -> Keep commands narrow and request/response based, with timeouts and correlation IDs.
- Large HTML or screenshots over WebSocket -> First implementation should cap payloads and use diagnostics artifacts for large failure data.

## Migration Plan

1. Add backend site config and pending auth task models without changing public consumers.
2. Extend the agent protocol with browser capability and browser command messages.
3. Implement desktop `PlaywrightHost`, local `BrowserProfileStore`, verification, and pending auth UI.
4. Replace backend provider wiring with the agent-backed provider and remove `LocalPlaywrightProvider` plus backend auth-bundle storage from the supported path.
5. Remove or deprecate CLI login/auth-bundle commands and update docs/tests to point users to CthuDesktop.
6. Keep browser diagnostics but ensure they do not include raw cookies, localStorage, or storage-state files.

Rollback is to leave browser content APIs disabled when no desktop agent advertises `browser`; backend should fail closed rather than falling back to local Playwright.

## Open Questions

- Should backend persist pending auth tasks durably, or is in-memory state enough for the first internal version?
- Which desktop agent should be default when multiple browser-capable agents are online?
- Should profile verification rules be generic site config data or site-specific verifier modules?
