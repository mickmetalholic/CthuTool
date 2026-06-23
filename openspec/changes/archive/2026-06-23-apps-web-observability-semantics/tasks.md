## 1. Web Logger Contract

- [x] 1.1 Define the web frontend logger levels, scopes, event names, correlation fields, and safe details shape.
- [x] 1.2 Define development and production console behavior for debug, info, warn, and error levels.
- [x] 1.3 Add redaction rules for tokens, cookies, raw HTML, screenshots, personal input values, and unbounded payloads.

## 2. Web Integration

- [x] 2.1 Add API request correlation conventions for status, duration, route/action label, and backend request id.
- [x] 2.2 Replace or prevent ad hoc frontend console calls in management-console code paths.
- [x] 2.3 Add observable UI warning and error boundary semantics for recoverable and route-level failures.
- [x] 2.4 Coordinate with app-shell logger/runtime contracts when shared pages are used.

## 3. Verification

- [x] 3.1 Add tests for logger level filtering and redaction behavior.
- [x] 3.2 Add tests for API correlation metadata capture and missing-request-id fallback.
- [x] 3.3 Add lint or test coverage that discourages direct ad hoc console usage where practical.
- [x] 3.4 Run web typecheck and relevant tests.
