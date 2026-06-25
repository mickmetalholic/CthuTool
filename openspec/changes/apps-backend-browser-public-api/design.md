## Context

The backend already exposes internal browser content orchestration and routes
controlled browser commands to CthuDesktop agents. CthuDesktop owns Playwright
execution, local browser profiles, and raw browser state. External applications
currently cannot use that capability directly except through domain-specific
backend APIs such as Douban movie lookup.

The new public API should make browser automation available to trusted
third-party applications without exposing the desktop agent WebSocket protocol
or raw Playwright script execution. It should also prepare for a future SDK that
offers a Playwright-like client experience.

## Goals / Non-Goals

**Goals:**

- Provide a stateful backend browser API with explicit session creation,
  action execution, and session closure.
- Keep backend session state thin and replaceable: backend stores routing
  metadata, while desktop stores Playwright browser context and page objects.
- Use a controlled action DSL that is close enough to Playwright for SDK
  ergonomics without allowing arbitrary script execution.
- Preserve site policy enforcement, profile ownership, and sensitive data
  boundaries.
- Allow the first implementation to use in-memory backend session routing while
  leaving a Redis-backed store as a future replacement.

**Non-Goals:**

- No API key, JWT, or user authorization system in this change.
- No raw Playwright protocol, CDP endpoint, or `playwright.connect()` support.
- No arbitrary `page.evaluate()` or executable script payloads.
- No backend-local browser runtime or backend-owned Playwright state.
- No multi-backend routing guarantees beyond the documented in-memory store
  constraints.

## Decisions

### Use backend-owned public sessions with desktop-owned browser state

The public API will expose backend session IDs. Backend stores a routing record
such as `sessionId`, `agentId`, `siteId`, `profileName`, timestamps, and expiry.
CthuDesktop stores the real Playwright context and page for the same session ID.

Alternative considered: encode `agentId` inside the session ID and make backend
fully stateless. That reduces backend state but leaks routing shape into public
IDs and makes future store-backed routing harder to evolve.

### Start with an in-memory session routing store

The first backend implementation can use an injectable in-memory store. The
store contract should support create, get, touch, close/delete, and expiry
cleanup so Redis can replace it later without changing controllers or SDK calls.

Alternative considered: implement Redis immediately. That adds deployment and
test complexity before the API shape is validated. Redis also cannot persist the
actual Playwright page or context, so desktop availability remains required.

### Use a bounded action DSL instead of raw Playwright passthrough

Browser actions will model common Playwright operations such as navigation,
selector waiting, click, fill, HTML content capture, text extraction, title, and
screenshot. Each action returns an ordered result item. Backend and desktop both
validate the action type and payload.

Alternative considered: accept arbitrary Playwright scripts or `evaluate`
payloads. That would turn the desktop agent into a remote code execution target
and would bypass existing site and profile boundaries.

### Route all session work through the desktop browser runtime

Backend controllers should not call the agent registry or WebSocket server
directly. Session creation, action execution, and closure go through
`DesktopBrowserRuntimeService`, which hides transport details and maps agent
errors to public API errors.

Alternative considered: create a new public API service that talks directly to
the agent command gateway. That would duplicate the boundary already documented
for desktop browser runtime.

### Keep API authentication out of this change but keep safety controls

API key support is deliberately deferred. The public browser API still enforces
configured site origins, action allowlists, timeouts, response size limits, and
non-exposure of cookies or storage state.

## Risks / Trade-offs

- In-memory routing is lost on backend restart -> expire affected public
  sessions and require clients to create new sessions.
- Multiple backend replicas cannot share in-memory session routes -> first
  deployment must use one backend instance or sticky routing until Redis-backed
  routing and distributed agent command routing exist.
- Desktop disconnects while sessions are active -> backend marks operations as
  browser unavailable and cleans routing records after TTL.
- Long-lived sessions can leak browser resources -> backend and desktop both
  enforce TTL cleanup and `DELETE /sessions/:id` closure.
- Playwright-like DSL may not cover every crawler workflow -> add actions
  incrementally rather than opening arbitrary script execution.
