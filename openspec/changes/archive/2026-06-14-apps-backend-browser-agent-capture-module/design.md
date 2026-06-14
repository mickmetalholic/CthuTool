## Context

`BrowserAutomationModule` now imports `AgentCommandGatewayModule`, `AgentStateModule`, `BrowserAuthModule`, and `SitesConfigModule`. That is already a healthier shape than the earlier all-in-one module, but one concrete integration concern remains inside browser automation: `AgentBrowserCaptureProvider` knows how to select a browser-capable agent, translate `BrowserContentRequest` data into an agent protocol command, map agent success/error messages back into backend capture snapshots or `BrowserAutomationError`s, and update pending auth state when the agent reports missing or expired auth.

Those details are not the same responsibility as `BrowserContentService`. The content service should orchestrate the content use case: resolve site metadata, enforce origin allowlists, run through task controls, classify blocks, save diagnostics, and return a stable content result. Agent command execution should be a replaceable capture-provider implementation behind a module boundary.

## Goals / Non-Goals

**Goals:**

- Introduce `BrowserAgentCaptureModule` as the backend boundary for agent-backed browser capture execution.
- Move agent command payload mapping, response mapping, browser-agent error mapping, and pending-auth side effects into that module.
- Keep `BrowserContentService` and `/api/browser/*` behavior unchanged.
- Keep `BrowserAutomationModule` as the browser content facade/use-case module.
- Preserve the existing `BROWSER_CAPTURE_PROVIDER` injection contract for `BrowserContentService`.

**Non-Goals:**

- Do not add a backend-local Playwright capture provider.
- Do not change desktop agent protocol message shapes or command correlation behavior.
- Do not move site config, browser auth, agent state, diagnostics storage, task runner behavior, or browser block detection in this change.
- Do not rename public `/api/browser/*` routes.

## Decisions

### Decision: Create `BrowserAgentCaptureModule`

`BrowserAgentCaptureModule` owns the concrete agent-backed capture implementation and exports the `BROWSER_CAPTURE_PROVIDER` binding. It imports `AgentCommandGatewayModule` and `BrowserAuthModule` because those are required to execute agent commands and record auth side effects.

Alternative considered: move the provider into `AgentCommandGatewayModule`. That would make the gateway browser-aware and blur its capability-neutral command-dispatch boundary.

### Decision: Keep the capture token stable

`BrowserContentService` should continue injecting `BROWSER_CAPTURE_PROVIDER`. Only the provider registration location changes. This keeps the content service contract stable and avoids a broad rename across tests and future providers.

Alternative considered: rename the token to an agent-specific token. That would leak the current implementation into the content use case and make future non-agent providers harder to introduce.

### Decision: Leave task runner, diagnostics, and block detection in browser automation

Task execution controls, diagnostic persistence, and block classification are part of the browser content use case rather than agent command transport. Keeping them in `BrowserAutomationModule` avoids creating a module that is just a thin wrapper around the whole existing service.

Alternative considered: create a larger `BrowserContentModule`. That may be useful later, but it would mix this provider-boundary extraction with a broader facade rename.

## Risks / Trade-offs

- Provider token ownership can become unclear -> export `BROWSER_CAPTURE_PROVIDER` only from `BrowserAgentCaptureModule` and remove duplicate registration from `BrowserAutomationModule`.
- Test wiring may mask missing module imports -> add focused module compilation coverage for both `BrowserAgentCaptureModule` and `BrowserAutomationModule`.
- Pending auth side effects are easy to lose during the move -> keep existing provider behavior covered by tests for missing/expired auth error mapping.
- The module name is slightly long -> it is explicit about both the domain (`browser`) and implementation boundary (`agent capture`), which matters more than brevity here.

## Migration Plan

1. Create `apps/backend/src/modules/browser-agent-capture` with `BrowserAgentCaptureModule`.
2. Move `AgentBrowserCaptureProvider` and its focused tests into the new module.
3. Keep shared request/result/error types either in `browser-automation` for now or move only if an existing type boundary supports it cleanly.
4. Import `BrowserAgentCaptureModule` from `BrowserAutomationModule` and remove direct provider registration there.
5. Run focused provider, content service, browser automation module, and new module wiring tests plus backend build/typecheck.

Rollback is straightforward: move the provider and provider registration back into `BrowserAutomationModule` and remove the new module import.

## Open Questions

- Should browser capture request/result types eventually move to a neutral shared backend location if another module consumes the provider directly?
- Should `BrowserAgentCaptureModule` expose a concrete service API in addition to the existing provider token, or is token export enough until a second provider exists?
