## 1. Bridge and Web Route Foundations

- [x] 1.1 Confirm `extract-local-agent-runtime` and `add-agent-environment-routing` are applied and their control/environment contracts are stable.
- [x] 1.2 Add the versioned loopback JSON bridge module with random `127.0.0.1`/verified `::1` binding and no static asset routes.
- [x] 1.3 Add the deployed `apps/web` Agent console/settings route using the existing Web UI and environment deployment configuration.
- [x] 1.4 Define bridge version negotiation, typed resource/RPC schemas, bounded polling, and stable error categories.

## 2. Ticket and Request Security

- [x] 2.1 Implement tray/CLI issuance of high-entropy single-use tickets scoped to active environment, exact Web Origin, bridge instance, and short expiry.
- [x] 2.2 Implement fragment bootstrap exchange, immediate `history.replaceState`, short-lived bearer sessions, and memory-only Web token storage.
- [x] 2.3 Enforce exact active Origin, exact Host/port, restrictive CORS/preflight, JSON plus Authorization headers, `Vary: Origin`, and no cross-site cookies.
- [x] 2.4 Invalidate tickets/sessions on consumption, expiry, Agent restart, and environment switch.
- [x] 2.5 Add adversarial tests for replay, wrong Origin/environment/instance, DNS-rebinding-style Host input, simple-form CSRF, port scanning, and secret telemetry leakage.

## 3. Local Resources and Operations

- [x] 3.1 Expose sanitized active environment, Agent/backend, version, Chrome, profile, autostart, and diagnostic resources.
- [x] 3.2 Expose only configured/missing/invalid status for static secrets and prove their values never leave the Agent.
- [x] 3.3 Implement typed atomic local settings mutations with immediate/reconnect/restart effect classification.
- [x] 3.4 Implement confirmed active-environment profile deletion with lock rejection and sanitized events.
- [x] 3.5 Expose lifecycle-adapter actions while rejecting Web attempts to change the trusted active environment.
- [x] 3.6 Expose existing controlled browser commands with correlation, time/payload bounds, challenges, and arbitrary-script rejection.

## 4. Deployed Web Experience

- [x] 4.1 Build Agent bootstrap states for permission required/denied, not running, expired ticket, Origin mismatch, environment mismatch, version incompatibility, backend offline, and ready.
- [x] 4.2 Build local environment/runtime, Chrome/profile, autostart, settings, diagnostics, and controlled browser sections from negotiated bridge resources.
- [x] 4.3 Add explicit confirmation, loading, polling progress, challenge, stale-session, reconnect, and update-required interactions.
- [x] 4.4 Apply a restrictive Agent-route CSP and dependency/telemetry tests proving no third-party executable code or local secrets are captured.
- [x] 4.5 Add accessibility, keyboard navigation, responsive layout, and shared-Web-UI regression coverage.

## 5. Browser Compatibility and Verification

- [x] 5.1 Run a Local Network Access spike on supported Chrome/Edge/Firefox/Safari targets using Fetch and `targetAddressSpace: "loopback"` where available.
- [x] 5.2 Document permission remediation and prove Fetch/polling remains functional without WebSocket.
- [x] 5.3 Run targeted Agent/Web lint, TypeScript checks, API/browser/security tests, production Web build validation, and `git diff --check`.
- [x] 5.4 Run strict OpenSpec validation for `add-web-agent-local-bridge` and map each security/compatibility scenario to coverage.
- [x] 5.5 Confirm generated Agent adapter files and unrelated OpenSpec changes remain unchanged.
