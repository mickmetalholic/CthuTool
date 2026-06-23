## Why

Backend failures currently span HTTP routes, browser content orchestration, desktop-agent command dispatch, diagnostics storage, and domain-specific APIs without a shared observability vocabulary. Defining backend observability semantics first makes request failures, browser automation outcomes, and agent transport issues traceable before adding any external telemetry consumer.

## What Changes

- Define backend request context semantics for request identifiers, correlation metadata, route labels, response status, duration, and stable error codes.
- Define structured backend log event categories for HTTP requests, exceptions, browser content tasks, diagnostics persistence, agent command dispatch, and readiness state.
- Define backend metrics and trace naming conventions for request latency, browser task queue behavior, command timeouts, blocked detections, and health/readiness checks.
- Require diagnostics references to correlate with request and command context without returning sensitive artifacts inline.
- Define backend readiness semantics that distinguish process liveness from dependencies such as desktop browser agent availability and diagnostics storage health.
- Do not introduce an external observability backend in this change; consumer wiring belongs to later implementation/design work.

## Capabilities

### New Capabilities

- `apps-backend-observability`: Backend-owned request, log, metric, trace, diagnostics, and readiness semantics for CthuTool services.

### Modified Capabilities

- `apps-backend-agent-command-gateway`: Agent command dispatch and timeout behavior gains correlation and observability event requirements.
- `apps-backend-browser-content`: Browser content orchestration gains queue, duration, detection, timeout, and diagnostics correlation requirements.
- `apps-backend-desktop-browser-runtime`: Desktop browser runtime calls gain backend-side command correlation and runtime availability reporting requirements.
- `apps-backend-douban-movie-info`: Douban movie API failures gain observable domain error and browser retrieval correlation requirements.

## Impact

- Affects backend modules under `apps/backend/src`, especially bootstrap, exception handling, health, browser content, desktop browser runtime, agent command gateway, and Douban movie info.
- May introduce shared backend logging/interceptor/middleware abstractions and tests for observable event shape.
- May require later coordination with protocol, desktop, and config changes for cross-process correlation fields and runtime configuration.
- No breaking API changes are intended; public response payload changes, if any, should be limited to safe correlation identifiers.
