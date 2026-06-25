## 1. Protocol Contracts

- [x] 1.1 Add typed browser session create, run-actions, and close command payloads to `packages/agent-protocol`.
- [x] 1.2 Add typed browser session result and error payloads, including ordered action result items and failing action metadata.
- [x] 1.3 Add protocol tests for message creation, validation expectations, and unsupported command handling.

## 2. Desktop Browser Host

- [x] 2.1 Add a desktop browser session store that maps session IDs to Playwright context/page state with created, last-used, and expiry timestamps.
- [x] 2.2 Implement `browser.createSession` handling with site/profile policy support and duplicate-session rejection.
- [x] 2.3 Implement `browser.runActions` handling for the initial supported action DSL: navigation, selector wait, click, fill, text extraction, content, title, and screenshot.
- [x] 2.4 Implement `browser.closeSession` handling and TTL cleanup for local desktop sessions.
- [x] 2.5 Add desktop tests for action ordering, unsupported actions, timeout behavior, closure, cleanup, and sensitive state exclusion.

## 3. Backend Runtime And Store

- [x] 3.1 Add a backend browser session routing record model and injectable in-memory routing store.
- [x] 3.2 Extend `DesktopBrowserRuntimeService` with create-session, run-actions, and close-session methods routed through the agent command gateway.
- [x] 3.3 Map desktop runtime errors and interaction challenges to public backend error shapes without exposing transport or profile internals.
- [x] 3.4 Add backend unit tests for routing record creation, lookup, touch, expiry, close, and owner-agent routing.

## 4. Public Backend API

- [x] 4.1 Add public browser session controller routes for `POST /api/browser/sessions`, `POST /api/browser/sessions/:sessionId/actions`, and `DELETE /api/browser/sessions/:sessionId`.
- [x] 4.2 Validate session creation requests against configured site IDs, auth policy, profile metadata, timeout limits, and origin allowlists.
- [x] 4.3 Validate run-action requests for supported action types, navigation origins, payload size limits, output size limits, and timeout bounds.
- [x] 4.4 Ensure public responses exclude cookies, localStorage, Playwright storage-state contents, desktop profile paths, raw WebSocket objects, and raw Playwright handles.
- [x] 4.5 Add controller and integration tests for successful sessions, unavailable browser agents, unknown sites, rejected origins, unsupported actions, session expiry, and close behavior.

## 5. Documentation And Verification

- [x] 5.1 Document the trusted-deployment assumption, in-memory routing limitation, session lifecycle, and action DSL in backend or browser docs.
- [x] 5.2 Run affected package tests for `packages/agent-protocol`, `apps/backend`, and `apps/desktop`.
- [x] 5.3 Run `openspec validate apps-backend-browser-public-api --strict`.
- [x] 5.4 Confirm generated `.claude/`, `.codex/`, and `.cursor/` adapter files remain unchanged unless explicitly regenerated.
