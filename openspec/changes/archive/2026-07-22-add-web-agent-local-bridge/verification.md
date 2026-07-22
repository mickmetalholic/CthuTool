# Verification map

## Bridge and launch security

| Scenario | Coverage |
| --- | --- |
| Random IPv4 and verified IPv6 loopback binding; no assets | `packages/agent-runtime/src/local-bridge.spec.ts` loopback and JSON-only tests |
| Versioned typed session/resources/RPC | `packages/agent-bridge-protocol/src/index.spec.ts`; runtime local-bridge tests |
| High-entropy scoped launch through local control | `packages/agent-runtime/src/control-protocol.spec.ts`; `apps/agent/src/index.spec.ts` |
| Fragment removed and bearer retained only in a non-enumerable private field | `apps/web/src/lib/agent-bridge-client.spec.ts` |
| Ticket replay, expiry, wrong environment/instance | `packages/agent-runtime/src/local-bridge.spec.ts` |
| Exact Origin and DNS-rebinding-style Host rejection | `packages/agent-runtime/src/local-bridge.spec.ts` |
| Non-simple JSON, restrictive preflight, no cookie authentication | `packages/agent-runtime/src/local-bridge.spec.ts` |
| Blind port probe does not discover or authorize the bridge | `packages/agent-runtime/src/local-bridge.spec.ts`; Web client requires launch fragment and never enumerates ports |
| Restart/environment switch invalidation | local bridge stop/invalidate tests and `packages/agent-runtime/src/runtime-service.spec.ts` |

## Resources and operations

| Scenario | Coverage |
| --- | --- |
| Sanitized environment/Agent/backend/browser/profile/autostart/diagnostics | protocol resource validation and Agent-process bridge E2E |
| Static secret value never returned | local-bridge secret assertion; resource schema exposes status only |
| Atomic settings and immediate/reconnect/restart classification | Agent-process settings E2E plus atomic environment storage tests |
| Confirmed profile deletion and active lock rejection | local-bridge typed-operation tests |
| Web environment mutation rejected | strict protocol tests and browser-command trust-boundary adversarial test |
| Lifecycle adapter unavailable vs accepted | local-bridge typed-operation tests |
| Controlled browser correlation, payload/time bounds, challenge, no arbitrary script | browser-runtime validation, local bridge request/timeout tests, Web challenge UI |

## Deployed Web and compatibility

| Scenario | Coverage |
| --- | --- |
| Permission/not-running/ticket/Origin/environment/version/backend/ready states | bridge-client state tests and Agent console rendering |
| Explicit confirmation, action loading, polling progress, stale reconnect, update command | Agent console implementation and semantic rendering tests |
| No WebSocket dependency | bridge-client polling test installs a throwing WebSocket constructor and still completes bounded Fetch polling |
| Restrictive no-third-party executable policy | nonce-based CSP unit test, Next production build, and live `/agent` response inspection |
| Fragment/ticket/bearer/endpoint telemetry redaction | `apps/web/src/lib/observability.spec.ts` |
| Keyboard/landmark/live-region/responsive behavior | Agent console semantic rendering test and responsive/reduced-motion CSS |
| Chrome/Edge/Firefox/Safari release position | `docs/agent-local-network-access.md` |
| Actual LNA Fetch path | `pnpm --filter @cthutool/agent-runtime test:lna`; Chrome 150 passed with `targetAddressSpace: "loopback"`; unavailable/manual targets are reported rather than synthesized |
