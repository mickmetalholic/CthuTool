## 1. Environment Foundations

- [x] 1.1 Confirm `extract-local-agent-runtime` is applied and its runtime/control boundaries are stable.
- [x] 1.2 Define typed environment profiles containing id, label, exact Web origin, same-origin Agent-console URL, backend HTTPS/WSS endpoints, and local namespace identifiers.
- [x] 1.3 Implement release-controlled profile loading plus explicit warned custom-development profile support.
- [x] 1.4 Implement persisted single active environment and environment-scoped config, secret, profile, and log path resolution.

## 2. Minimal Public Access Protection

- [x] 2.1 Reuse existing Web session protection for public Agent status/machine-control APIs or implement a verified single-operator access-gateway/minimal-session adapter.
- [x] 2.2 Add production readiness checks that reject anonymous public machine-control deployment and untrusted proxy identity headers.
- [x] 2.3 Implement per-environment static Agent-secret configuration and constant-time authentication before WebSocket registration.
- [x] 2.4 Add an explicit loopback/private development exception that cannot activate in production configuration.
- [x] 2.5 Add structural redaction tests for Agent secrets, operator passwords/sessions, authorization headers, and local bridge tickets.

## 3. Protocol, Registry, and Gateway

- [x] 3.1 Extend `@cthutool/agent-protocol` with environment id, stable Agent id, version, and connection-generation lifecycle/correlation metadata.
- [x] 3.2 Key registry connections by environment plus Agent id and make the latest authenticated generation authoritative.
- [x] 3.3 Protect Agent status APIs with the operator boundary and omit transport/authentication internals.
- [x] 3.4 Change gateway inputs/callers to require trusted environment context and remove first-capable-Agent fallback.
- [x] 3.5 Bind pending commands to environment, Agent id, and generation and fail reconnect/timeouts without cross-environment rerouting.

## 4. Agent Environment Switching

- [x] 4.1 Update the headless Agent and Electron compatibility adapter to connect using the active environment's WSS endpoint and static secret.
- [x] 4.2 Implement the switching state that rejects new work, drains/cancels pending work, closes browser contexts, invalidates local bridge tickets, changes namespaces, and reconnects.
- [x] 4.3 Add idempotent same-environment selection and degraded target-backend failure behavior without automatic fallback.
- [x] 4.4 Add tests proving production/test secrets, profiles, logs, commands, and Web origins remain isolated.

## 5. Verification and Rollout

- [x] 5.1 Add end-to-end tests for operator rejection, Agent-secret rejection, reconnect generation, environment switch, capability mismatch, and no-reroute behavior.
- [x] 5.2 Run targeted backend/runtime lint, TypeScript checks, protocol/integration/security tests, and `git diff --check`.
- [x] 5.3 Run strict OpenSpec validation for `add-agent-environment-routing` and document static-secret replacement and access-gateway deployment.
- [x] 5.4 Confirm generated Agent adapter files and unrelated OpenSpec changes remain unchanged.
