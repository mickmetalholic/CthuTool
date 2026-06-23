## 1. Desktop Event Semantics

- [ ] 1.1 Define desktop main-process event names and safe payload fields for agent and browser runtime diagnostics.
- [ ] 1.2 Define renderer-safe diagnostic summaries for connection, browser runtime, pending auth, and last-error state.
- [ ] 1.3 Define local redaction rules for profile paths, storage state, cookies, raw HTML, screenshots, and tokens.

## 2. Desktop Integration

- [ ] 2.1 Add agent connection lifecycle diagnostics for connect, register, reconnect, heartbeat state, close, and backend rejection.
- [ ] 2.2 Add browser host command lifecycle diagnostics for receipt, readiness, execution, detection, completion, and failure.
- [ ] 2.3 Preserve command correlation metadata from backend commands when available.
- [ ] 2.4 Surface safe diagnostic summaries in Settings and agent console views.

## 3. Verification

- [ ] 3.1 Add main-process tests for agent lifecycle and browser command diagnostic event shape.
- [ ] 3.2 Add renderer tests for safe diagnostic status presentation.
- [ ] 3.3 Verify diagnostics do not expose raw browser storage, screenshots, HTML, or profile internals.
- [ ] 3.4 Run desktop typecheck and relevant tests.
