## Context

Backend observability spans Nest bootstrap, request handling, exception filtering, browser content orchestration, agent command dispatch, desktop browser runtime calls, diagnostics storage, and domain APIs such as Douban movie lookup. The current code has isolated logging, health responses, and browser diagnostics, but it does not have one request context or event vocabulary that ties a user operation to browser and agent work.

## Goals / Non-Goals

**Goals:**
- Establish a backend request context that can flow through HTTP handling, browser content work, diagnostics, and agent command dispatch.
- Standardize backend event names, safe fields, metric labels, and readiness semantics.
- Preserve sensitive artifact boundaries while allowing diagnostics identifiers to be correlated with failures.

**Non-Goals:**
- Selecting or deploying a telemetry consumer such as Grafana, Sentry, or an OTLP collector.
- Changing browser access-control behavior or retry policy.
- Exposing raw browser artifacts in logs or API responses.

## Decisions

1. Use backend-owned request context as the root local correlation primitive.
   - Rationale: Backend receives most user and frontend requests and can attach context before browser or agent work starts.
   - Alternative considered: rely only on agent command ids. That cannot describe HTTP failures before command dispatch.

2. Keep structured logging independent from telemetry export.
   - Rationale: JSON-like event shape can be tested and consumed locally before external exporters exist.
   - Alternative considered: add OpenTelemetry first. That would not solve project-specific event naming or redaction rules.

3. Treat browser diagnostics as references, not inline log payloads.
   - Rationale: Browser HTML and screenshots can be large or sensitive; diagnostics ids are safer correlation points.
   - Alternative considered: include diagnostic excerpts in logs. This increases leakage and payload risk.

4. Separate liveness from readiness.
   - Rationale: The backend process can be alive while browser agent or diagnostics storage is degraded.
   - Alternative considered: one health endpoint with all dependency state. This makes simple process checks too fragile.

## Risks / Trade-offs

- Event schema drift across modules -> define shared event helpers and tests for shape.
- Too many labels in metrics -> keep labels bounded to route, operation, outcome, error code, and detection kind.
- Request context may not cross async boundaries reliably -> start with explicit context passing or a well-tested request-context utility.
- Readiness can become noisy when no desktop agent is expected -> make dependency status explicit rather than treating every dependency degradation as process failure.

## Migration Plan

1. Introduce backend observability primitives without changing public behavior.
2. Attach request context to HTTP entry points and exception responses where safe.
3. Add browser content, runtime, and command gateway events.
4. Expand readiness responses after dependency checks are available.
5. Keep rollback simple by leaving existing functional paths intact and disabling new event output through configuration if needed.

## Open Questions

- Which request identifier header names should be accepted and emitted?
- Should readiness be a separate `/ready` route or an expanded existing health payload?
- Should the first implementation include OpenTelemetry spans, or only structured events and metrics naming?
