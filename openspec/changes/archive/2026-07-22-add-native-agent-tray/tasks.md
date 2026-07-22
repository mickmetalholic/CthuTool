## 1. Native Tray Foundation

- [x] 1.1 Confirm runtime readiness/shutdown, environment-switch, and deployed-Web bridge-launch contracts are applied before integration.
- [x] 1.2 Create and pin the standalone Rust tray crate/toolchain and add focused tray, menu, single-instance, process, and browser-open dependencies.
- [x] 1.3 Add native icons, accessibility labels, and platform adapters without Tauri, a WebView, or any application window.

## 2. Instance and Agent Supervision

- [x] 2.1 Implement user-scoped single-instance records with executable/PID/nonce/control-handshake validation and stale recovery.
- [x] 2.2 Implement bundled Node.js/Agent child launch and versioned same-user readiness handshake without a persistent local-control credential.
- [x] 2.3 Model starting, ready, switching-environment, backend-offline/degraded, crash-loop, stopping, and error tray states separately.
- [x] 2.4 Implement exponential restart backoff, crash-window budget, and latched error behavior with deterministic tests.
- [x] 2.5 Make a second valid tray invocation request Open CthuTool from the authoritative instance and then exit.

## 3. Environment and Browser Interaction

- [x] 3.1 Implement status, Open CthuTool, radio-style Environment submenu, and Exit; prove Pause/Stop Tasks/tray-only modes are absent.
- [x] 3.2 Bind checked environment and status to Agent-reported state and implement the complete environment-switch request/error flow.
- [x] 3.3 Request a fresh one-time bridge ticket and open the selected deployed Web URL with endpoint, ticket, and environment only in the fragment.
- [x] 3.4 Add supported Windows double-click and macOS primary-activation behavior with context-menu fallback.
- [x] 3.5 Add tests for repeated activation, expired tickets, unavailable bridge, invalid environment, and switch cleanup/isolation.

## 4. Coordinated Exit

- [x] 4.1 Implement graceful same-user Agent shutdown, browser-context drain/cancel, lock release, and child-exit confirmation.
- [x] 4.2 Implement bounded forced termination only after exact child identity validation and timeout.
- [x] 4.3 Make CLI stop and operating-system session termination invoke the same tray-owned shutdown path.
- [x] 4.4 Add tests proving Exit leaves neither tray nor Agent alive and does not signal unrelated reused PIDs.

## 5. Verification

- [x] 5.1 Run Rust format/lint/tests, targeted Node.js integration tests, supported-platform tray smoke tests, and `git diff --check`.
- [x] 5.2 Run strict OpenSpec validation for `add-native-agent-tray` and record platform gesture limitations against the context-menu fallback.
- [x] 5.3 Confirm generated agent adapters and unrelated OpenSpec changes remain unchanged.
