## Context

Different apps need common observability settings such as log level, diagnostics enablement, console diagnostics behavior, sampling, and optional exporter endpoints. Today those settings would be defined independently by each app.

## Goals / Non-Goals

**Goals:**
- Define a shared observability configuration schema and validation behavior.
- Provide safe defaults for development and production.
- Keep observability configuration separate from browser site and auth configuration.

**Non-Goals:**
- Forcing every app to adopt every config key immediately.
- Storing secrets, cookies, browser storage state, or local profile data.
- Instantiating logging or telemetry clients in the config package.

## Decisions

1. Keep config parsing pure and dependency-light.
   - Rationale: `packages/config` should validate shape and return typed values, not create runtime clients.
   - Alternative considered: initialize observability SDKs from config. That couples config to runtime dependencies.

2. Use explicit environment variable names for shared settings.
   - Rationale: Apps can document and adopt the same names without sharing runtime code paths.
   - Alternative considered: app-specific names only. That creates drift.

3. Treat exporter endpoints as optional.
   - Rationale: Local development should work without an external telemetry backend.
   - Alternative considered: require an endpoint whenever observability is enabled. That makes local use brittle.

## Risks / Trade-offs

- Shared keys may not fit every app -> define core keys and allow app-specific extension outside the shared schema.
- Config can imply behavior that apps do not implement yet -> apps should adopt keys only when their observability implementation supports them.
- Endpoint values can contain secrets -> document token handling separately and avoid logging raw config values.

## Migration Plan

1. Add observability config schema, defaults, and validation tests.
2. Export typed helpers from `packages/config`.
3. Let backend, desktop, web, and CLI adopt the helpers in their own implementation changes.
4. Update examples after app adoption.

## Open Questions

- Should sampling be defined as a ratio, a mode enum, or both?
- Should console diagnostics be configured separately for frontend and backend runtimes?
- Which exporter endpoint variables should be included in the first shared schema?
