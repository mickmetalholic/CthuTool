## Context

`packages/app-shell` provides host-neutral runtime and page composition used by desktop and future web surfaces. Observability semantics here should define shared logger and status presentation contracts without making the package depend on Electron, backend internals, or a telemetry vendor.

## Goals / Non-Goals

**Goals:**
- Define a shared frontend logger shape for app-shell pages.
- Define host-neutral observable status data for backend, agent, browser runtime, diagnostics, and degraded states.
- Provide reusable presentation semantics for safe status summaries and diagnostics references.

**Non-Goals:**
- Fetching backend diagnostics directly from app-shell.
- Persisting logs or exporting telemetry.
- Adding host-only capabilities to web-safe runtime adapters.

## Decisions

1. Put logger and observable state behind runtime contracts.
   - Rationale: Host apps own data fetching and platform details; shared pages consume typed state.
   - Alternative considered: shared pages call host APIs directly. That breaks web-safe rendering.

2. Use safe summaries instead of raw log viewers.
   - Rationale: App-shell can present status without taking ownership of sensitive logs or artifacts.
   - Alternative considered: pass raw logs through shared components. That increases leakage risk.

3. Make observable state optional.
   - Rationale: Not every host will have backend, agent, or browser runtime state.
   - Alternative considered: require all runtime adapters to provide full state. That makes simple web adapters unnecessarily complex.

## Risks / Trade-offs

- Shared status shape may become too broad -> keep fields focused on status, freshness, safe error summaries, and diagnostics identifiers.
- Host apps may duplicate presentation -> provide reusable patterns but allow host-specific layout.
- Logger use can spread quickly -> define scope/event naming and redaction before broad adoption.

## Migration Plan

1. Define app-shell observable state and logger types.
2. Add default no-op or console-safe logger behavior for web-safe adapters.
3. Update shared status components to consume the new state shape.
4. Let desktop and web adapters provide real observable state in their app-level changes.

## Open Questions

- Should app-shell own a small diagnostics link component or only define data shape?
- Which status fields are common enough for the shared runtime versus app-specific extensions?
- Should shared logger output formatting be standardized or left to host adapters?
