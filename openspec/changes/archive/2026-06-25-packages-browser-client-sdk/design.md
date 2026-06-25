## Context

The backend public browser API change introduces stateful browser sessions and a
bounded action DSL. Third-party applications should not need to hand-roll HTTP
requests or reason about desktop agent routing. The SDK should turn that API
into a small TypeScript package with a Playwright-like experience while keeping
the backend as the only network target.

## Goals / Non-Goals

**Goals:**

- Add a workspace package that can be consumed by Node-based third-party
  applications.
- Provide typed request, response, action, and error models for the backend
  public browser API.
- Provide a convenience API that feels similar to common Playwright `Page`
  methods while still sending controlled backend actions.
- Make transport testable by allowing `fetch` injection and avoiding hidden
  global state.
- Document trusted-deployment assumptions and the fact that backend
  authentication is not part of the first version.

**Non-Goals:**

- No direct Playwright dependency.
- No browser, desktop agent, CDP, or WebSocket connection from the SDK.
- No automatic crawler scheduling, queueing, retry orchestration, or distributed
  session recovery.
- No API key support until the backend public API introduces authentication.
- No runtime support matrix beyond Node's built-in `fetch` environment for the
  first package version.

## Decisions

### Provide low-level and high-level APIs

The package will expose a `CthuBrowserClient` for raw session/action calls and a
`BrowserPage` convenience object returned by `client.newPage()`. The page object
will convert methods like `goto`, `click`, `fill`, `textContent`, `content`,
`title`, `screenshot`, and `close` into backend session/action requests.

Alternative considered: expose only a Playwright-like page object. That hides
too much of the backend API and makes testing new action types harder.

### Keep protocol types in the SDK package

The SDK should export its public option, action, result, and error types. It can
mirror the backend public API contract without importing backend application
code. Shared protocol packages can be introduced later if duplication becomes
costly.

Alternative considered: import DTOs directly from `apps/backend`. That would
couple third-party SDK builds to a server application package and blur package
ownership.

### Use injected fetch for transport

The client constructor accepts `baseUrl`, optional default headers, and optional
`fetch` implementation. This keeps tests deterministic and allows callers to
provide platform-specific fetch behavior.

Alternative considered: use a dedicated HTTP client dependency. Node 24 already
has `fetch`, and avoiding another dependency keeps the package simpler.

### Make session closure explicit

`BrowserPage.close()` will call the backend close-session endpoint. The SDK can
offer helper patterns such as `client.withPage()` so callers can reliably close
sessions with `try/finally`.

Alternative considered: rely on garbage collection or process exit to close
sessions. That would leak desktop Playwright state and conflict with the backend
session lifecycle.

## Risks / Trade-offs

- Backend API and SDK are proposed as separate changes -> keep SDK tests based
  on mocked HTTP responses and implement against the documented public contract.
- Playwright-like naming can imply unsupported Playwright semantics -> document
  that methods map to CthuTool controlled actions and do not expose raw
  Playwright objects.
- No API key support in v1 -> constructor should allow custom headers so a later
  auth change can be adopted without breaking the client shape.
- Stateful sessions can be leaked by callers -> provide `close()` and
  `withPage()` examples and test that close calls the backend endpoint.
