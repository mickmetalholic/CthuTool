## 1. App-Shell Contracts

- [x] 1.1 Define shared frontend logger types for level, scope, event, message, correlation, and safe details.
- [x] 1.2 Define observable runtime state types for backend connectivity, agent state, browser runtime, diagnostics availability, and degraded modes.
- [x] 1.3 Define default no-op or console-safe logger behavior for hosts without explicit logger support.

## 2. App-Shell Presentation

- [x] 2.1 Add shared status presentation patterns for observable state summaries and diagnostics identifiers.
- [x] 2.2 Ensure shared pages consume observable state through runtime adapters rather than host globals.
- [x] 2.3 Coordinate web and desktop adapters so host-specific state maps into the shared observable shape.
- [x] 2.4 Preserve web-safe rendering when observable state is unavailable.

## 3. Verification

- [x] 3.1 Add type tests for desktop, web-safe, and test runtime adapters with and without observable state.
- [x] 3.2 Add component tests for status summaries, degraded states, and diagnostics identifiers.
- [x] 3.3 Add tests or stories showing logger redaction and production-level filtering behavior.
- [x] 3.4 Run app-shell typecheck and relevant tests.
