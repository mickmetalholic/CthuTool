## Context

`apps/web` is the browser-hosted management console scaffold. It needs frontend debugging conventions before real workflows expand, especially for API correlation, user actions, recoverable UI failures, and development console output.

## Goals / Non-Goals

**Goals:**
- Define a safe frontend logger contract for development console diagnostics.
- Correlate API calls with backend request identifiers when available.
- Standardize UI error and warning semantics for future management-console pages.

**Non-Goals:**
- Adding browser telemetry upload or session replay.
- Logging raw response bodies, form values, tokens, cookies, HTML, or screenshots.
- Replacing backend observability with frontend logs.

## Decisions

1. Use a wrapper logger instead of direct console calls.
   - Rationale: A wrapper enforces levels, scopes, event names, redaction, and production behavior.
   - Alternative considered: code review conventions around `console.log`. Those are hard to enforce and test.

2. Treat frontend request id as a bridge to backend diagnostics.
   - Rationale: Frontend failures often need backend log lookup; request id makes that path explicit.
   - Alternative considered: rely on timestamps and URLs. That is brittle during concurrent requests.

3. Disable debug/info output by default in production.
   - Rationale: Development diagnostics are useful locally but can leak noise and context in production.
   - Alternative considered: always emit all frontend diagnostics. This makes production console output too noisy.

## Risks / Trade-offs

- Too much frontend logging can obscure real errors -> define levels and keep info/debug dev-only.
- Request identifiers may be missing until backend support lands -> logger must handle missing correlation gracefully.
- Redaction rules may hide useful context -> allow safe bounded details such as route labels, action names, status codes, and stable error codes.

## Migration Plan

1. Define frontend logger shape and safe detail rules.
2. Add API client conventions for request duration, status, and request id capture.
3. Add error boundary and warning event semantics.
4. Adopt the shared app-shell logger once available.

## Open Questions

- Should web logger configuration live locally or come from shared app-shell/config packages?
- Which backend response header should frontend use as the canonical request id?
- Should development diagnostics be toggleable at runtime?
