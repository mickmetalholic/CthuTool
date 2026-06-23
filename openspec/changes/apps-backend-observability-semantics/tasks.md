## 1. Backend Observability Foundation

- [ ] 1.1 Define backend request context identifiers, accepted headers, generated id format, and safe propagation fields.
- [ ] 1.2 Add backend structured event helpers for request, exception, browser task, diagnostics, command, and readiness events.
- [ ] 1.3 Add backend redaction helpers for browser artifacts, auth state, tokens, profile paths, and unbounded payloads.

## 2. Backend Integration

- [ ] 2.1 Attach request context to HTTP request handling and exception responses where safe.
- [ ] 2.2 Emit request completion and failure events from the backend request boundary.
- [ ] 2.3 Add browser content queue, duration, detection, timeout, and diagnostics-reference events.
- [ ] 2.4 Add desktop browser runtime and agent command gateway dispatch, completion, timeout, and failure events.
- [ ] 2.5 Add liveness/readiness semantics that distinguish process health from dependency availability.

## 3. Verification

- [ ] 3.1 Add unit tests for request context creation, preservation, and redaction.
- [ ] 3.2 Add backend tests for browser content and command gateway observable event shape.
- [ ] 3.3 Add health/readiness tests for alive, degraded, and unavailable dependency states.
- [ ] 3.4 Run backend typecheck and relevant test suites.
