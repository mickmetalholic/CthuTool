## Context

The current backend already separates `agent/` from browser business modules, but the shared protocol package and desktop/browser state flow still carry old coupling. `@cthutool/agent-protocol` contains both transport lifecycle messages and browser capability messages. Desktop still has `browser.stateSnapshot`, pending-auth task storage, and task-center aggregation. Backend still has a `browser-automation/` directory that is no longer a Nest module but still owns shared browser errors, types, and auth helpers.

This design treats the change as intentionally breaking. It removes transitional compatibility rather than preserving old paths, and it makes the agent command protocol a JSON-RPC 2.0-compatible request/response/error transport that can carry browser and future capabilities without the agent layer knowing their domain contracts.

## Goals / Non-Goals

**Goals:**

- Use JSON-RPC 2.0-style command frames for agent command dispatch and response correlation.
- Keep agent transport package and backend agent modules capability-neutral.
- Move browser-specific command, result, error, and challenge contracts to a browser runtime protocol boundary.
- Remove browser state snapshots, pending auth task stores, task-center browser-auth aggregation, and backend compatibility APIs.
- Replace pending task flows with operation-scoped browser runtime challenges.
- Introduce `BrowserService` as the backend-facing browser business facade for page content, screenshot, auth status, login, verification, profile policy, permission checks, detection, and diagnostics.
- Delete `apps/backend/src/modules/browser-automation/` by moving surviving shared browser code under browser-owned boundaries.
- Keep Playwright execution desktop-owned and backend browser runtime as the backend-facing facade.

**Non-Goals:**

- Do not introduce backend-local Playwright execution.
- Do not preserve `/api/browser/profiles` or `/api/browser/pending-auth-tasks` compatibility endpoints.
- Do not preserve desktop pending-auth task UI or task-center browser-auth behavior.
- Do not create durable challenge storage in backend or desktop. Challenges are returned from the operation that needs user action.
- Do not make `BrowserService` a raw Playwright RPC facade; it exposes product-approved browser workflows rather than arbitrary selectors, scripts, pages, contexts, or cookies.
- Do not redesign unrelated desktop navigation or non-browser task-center concepts unless required to remove browser-auth task dependencies.

## Decisions

### Use JSON-RPC 2.0-compatible command frames

Agent command traffic will use a JSON-RPC 2.0-compatible subset:

```json
{
  "jsonrpc": "2.0",
  "id": "command-id",
  "method": "browser.capturePage",
  "params": {}
}
```

Success responses use:

```json
{
  "jsonrpc": "2.0",
  "id": "command-id",
  "result": {}
}
```

Failure responses use:

```json
{
  "jsonrpc": "2.0",
  "id": "command-id",
  "error": {
    "code": -32001,
    "message": "Browser login required",
    "data": {
      "code": "AUTH_PROFILE_REQUIRED",
      "challenge": {}
    }
  }
}
```

The JSON-RPC `error.code` remains numeric to stay compatible with the spec. Stable application error codes live in `error.data.code`. Browser runtime challenges live in `error.data.challenge`.

Alternative considered: keep `browser.command`, `browser.result`, and `browser.error` while only renaming fields. That would leave browser-specific frame types in agent transport and would not satisfy the goal of making agent command dispatch generic.

### Keep lifecycle messages separate from command messages

`agent.hello`, `agent.heartbeat`, `agent.registered`, and transport-level `agent.error` remain lifecycle messages. JSON-RPC is used for command dispatch after registration.

Lifecycle messages are still JSON objects with a string `type` field on the wire, but source code should not rely on ad hoc string literals. `@cthutool/agent-protocol` will export:

- `AgentLifecycleMessageType` as a closed literal union.
- `AGENT_LIFECYCLE_MESSAGE_TYPES` or equivalent named constants for `agent.hello`, `agent.heartbeat`, `agent.registered`, and `agent.error`.
- A discriminated union schema for lifecycle messages keyed by `type`.
- Parse/guard helpers such as `parseAgentLifecycleMessage` and `isAgentLifecycleMessage`.

Backend and desktop code should import these constants and schemas rather than comparing arbitrary strings. This keeps lifecycle direct and explicit while still making the protocol typed and centrally validated.

Alternative considered: model registration and heartbeat as JSON-RPC methods too. That is cleaner in theory, but it expands the migration and makes connection lifecycle less explicit. The current problem is command/capability coupling, so lifecycle can remain direct.

### Split protocol ownership by package boundary

`@cthutool/agent-protocol` will own:

- Agent lifecycle messages.
- Public agent status and capability metadata.
- JSON-RPC request, success response, and error response schemas.
- Generic parsing helpers for lifecycle and JSON-RPC frames.

A browser runtime protocol boundary will own:

- Browser method names such as `browser.capturePage`, `browser.openLogin`, and `browser.verifyProfile`.
- Browser command params, results, public profile/status metadata, detections, and interaction challenge schemas.
- Helpers that build typed JSON-RPC browser requests and parse browser results/errors.

This can be implemented as a new package, `@cthutool/browser-runtime-protocol`, or as a temporary package sub-boundary only if package creation proves too disruptive. The preferred target is a new package because it makes imports enforce the intended architecture.

Alternative considered: keep browser exports in `@cthutool/agent-protocol` behind subpath exports. This reduces package churn but keeps the conceptual ownership muddled and makes future coupling easier.

### Agent gateway dispatches by method and params only

`AgentCommandGateway` will accept a JSON-RPC request envelope or a typed wrapper containing `id`, `method`, and `params`. It will:

- Select a target agent by id or capability.
- Write the request to the active WebSocket.
- Track pending calls by JSON-RPC `id`.
- Resolve success responses with `result`.
- Reject or resolve structured errors from `error`.
- Remove pending calls on timeout, disconnect, or server shutdown.

It will not branch on browser method names or inspect browser params/result shapes.

### Browser runtime maps JSON-RPC to domain results and challenges

`DesktopBrowserRuntimeService` is responsible for browser method names and browser protocol contracts. It will:

- Build browser JSON-RPC requests through browser runtime protocol helpers.
- Call the generic agent gateway.
- Parse browser success results.
- Convert browser JSON-RPC errors into runtime errors or `InteractionChallenge`.

Auth-required, expired profile, verification failed, blocked, captcha, and rate-limit outcomes should become structured operation challenges or detections at this boundary rather than backend or desktop task records.

### Expose backend browser workflows through BrowserService

External backend business modules will import `BrowserModule` and use `BrowserService` as the stable browser business facade. `BrowserModule` is the browser area's public aggregate module, similar to how the backend agent area exposes its public module boundary while hiding transport internals. `BrowserService` sits above `DesktopBrowserRuntimeService` and owns cross-cutting browser workflow policy:

- Site configuration lookup and effective option resolution.
- Origin allowlist and permission checks before any desktop browser work is dispatched.
- Profile name, auth policy, login URL, verification URL, timeout, and resource-blocking defaults.
- Page content capture and screenshot capture workflows.
- Auth status, open-login, and verify-profile workflows.
- Detection for login-required, captcha, abnormal access, rate limiting, and blocked pages.
- Diagnostics persistence and public diagnostic references.
- Mapping runtime errors/challenges into browser-domain results and errors.

`BrowserContentService` and `BrowserAuthModule` should not remain the primary external integration points. Their current logic can move into `BrowserService` or become internal helpers used only by `BrowserService`. Business modules such as Douban movie info should depend on `BrowserService` for browser access instead of depending directly on `BrowserContentService`, `BrowserAuthService`, `DesktopBrowserRuntimeService`, `AgentCommandGateway`, or protocol packages.

`BrowserModule` can internally import or provide the browser runtime client, detection, diagnostics, auth/content helpers, and `SitesConfigModule`, but it should export only the public browser facade needed by backend business modules. This lets internal browser subdirectories be organized for implementation clarity without becoming a scattered dependency surface.

`DesktopBrowserRuntimeService` remains lower-level and intentionally thinner: it selects desktop agents, sends browser JSON-RPC commands, parses browser runtime results/errors, and returns typed runtime outcomes. It does not own site allowlists, product permission policy, Douban-specific behavior, diagnostics strategy, or content/auth workflow orchestration.

Alternative considered: let every business module call `DesktopBrowserRuntimeService` directly. That keeps fewer services, but it would spread site policy, auth/profile option resolution, allowed-origin checks, detection, and diagnostics into each business module. `BrowserService` keeps that messy browser workflow logic centralized while preserving a clean lower-level runtime boundary.

### Remove BrowserSitesModule

`BrowserSitesModule` is a thin HTTP wrapper over `SitesConfigService.listSites()` and does not own independent browser behavior. It should be deleted as a separate backend module boundary.

`SitesConfigModule` remains the owner of effective site configuration loading, override merging, lookup, and copied public site summaries. Backend services, including `BrowserService`, should import `SitesConfigModule` and consume `SitesConfigService` directly.

The existing `/api/browser/sites` route should be removed rather than preserved as a compatibility endpoint. If the desktop renderer needs site information after this refactor, it should receive the relevant public site/profile/status data through the new browser facade/status surface, not through a standalone sites route. The important ownership rule is that site configuration is backend-internal configuration for browser workflows, not a separate browser runtime feature.

### Remove state snapshots and pending auth tasks

`browser.stateSnapshot` will be removed from protocol schemas and desktop agent client behavior. Backend will no longer accept, store, or project browser profile/pending-auth snapshots.

Desktop pending auth task storage will be deleted. Playwright host code will stop upserting/resolving pending tasks. Renderer APIs will stop fetching backend pending tasks or local pending tasks. Browser-auth UI flows should render challenges from the operation that failed or from explicit runtime/profile status APIs.

Alternative considered: keep local pending tasks but remove backend pending tasks. That still leaves the task-center model as the primary auth workflow and contradicts the decision to use operation-scoped challenges.

### Delete backend `browser-automation/` as an ownership boundary

Remaining files under `apps/backend/src/modules/browser-automation/` will move to browser-owned paths:

- Browser errors -> `apps/backend/src/modules/browser/shared/browser-errors.ts`.
- Content request/result/detection/diagnostic types -> `apps/backend/src/modules/browser/browser.types.ts`, `browser/content`, or `browser/shared` when reused.
- Auth bundle helpers and auth state store -> `apps/backend/src/modules/browser/auth/` or internal `BrowserService` helpers.

After migration, imports from `../browser-automation/*` or `../../browser-automation/*` should not exist.

## Risks / Trade-offs

- **Breaking protocol change** -> Update backend, desktop, package tests, and any fixtures in one implementation slice so mixed protocol versions are not supported accidentally.
- **JSON-RPC error typing can become too loose** -> Keep valibot schemas for `error.data.code` and browser challenge payloads in browser runtime protocol.
- **Removing task-center browser-auth flows may temporarily reduce global visibility of login needs** -> Surface challenges in the active browser/Douban workflow and expose explicit runtime status actions instead of global pending tasks.
- **Package split can create dependency cycles** -> `agent-protocol` must not depend on browser runtime protocol. Browser runtime protocol may depend on shared primitives only if they are capability-neutral.
- **Large file moves can obscure behavior changes** -> Move types/helpers first, update imports, then delete old paths after tests pass.
- **Desktop and backend could disagree on method names during migration** -> Method names and schemas should be exported from browser runtime protocol and imported by both sides.
- **BrowserService can become a new catch-all module** -> Keep it limited to approved backend browser workflows and keep raw Playwright primitives inside the desktop host/runtime protocol.
- **Removing the site listing route can break old desktop calls** -> Update desktop renderer calls in the same implementation slice and avoid preserving compatibility code for `/api/browser/sites`.

## Migration Plan

1. Add JSON-RPC schemas and helpers to the generic agent protocol boundary.
2. Normalize `agent.*` lifecycle message types in the generic agent protocol boundary as exported constants, literal unions, and discriminated union schemas.
3. Add the browser runtime protocol boundary with browser method names, params, results, errors, and challenge schemas.
4. Add `BrowserModule` as the backend browser aggregate module, export `BrowserService`, and move external content/auth workflow entry points behind it.
5. Update backend `AgentWebSocketServer` and `AgentCommandGateway` to send and correlate JSON-RPC command frames only.
6. Update `DesktopBrowserRuntimeService` to build browser JSON-RPC requests and map JSON-RPC responses/errors.
7. Update desktop `AgentClient` to receive JSON-RPC requests and dispatch browser methods through the local browser handler.
8. Update desktop Playwright host to return browser runtime protocol results/errors/challenges without pending-auth task mutations.
9. Remove `browser.stateSnapshot`, browser profile snapshot schemas, pending auth task schemas, and related desktop sender code.
10. Remove backend profile/pending-task compatibility endpoints and renderer fetch/aggregation logic.
11. Delete `BrowserSitesModule` and remove the `/api/browser/sites` compatibility route.
12. Move remaining backend `browser-automation` errors, types, and auth helpers into browser-owned directories; delete the old directory.
13. Update Douban movie info and other browser-consuming backend modules to depend on `BrowserService`.
14. Update tests and run protocol package tests, backend build/tests, desktop focused tests/typecheck, targeted Biome checks, and strict OpenSpec validation.

Rollback before archive is a source-level revert of the change. After archive, rollback would need a compatibility change that reintroduces old wire messages, which is intentionally not part of this plan.

## Open Questions

- Should the browser runtime protocol be a new package immediately, or should implementation first create an internal package boundary and then publish it as a separate package in the same change?
- Which renderer surface should own displaying operation-scoped challenges returned by `BrowserService` for Douban and general browser workflows after task-center browser-auth rows are removed?
- Should JSON-RPC notifications be supported for future one-way agent messages, or should this change restrict command traffic to request/response only?
