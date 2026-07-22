## Scenario coverage

| Requirement | Scenario evidence |
| --- | --- |
| Headless local Agent process | `apps/agent/src/index.spec.ts` starts the process composition and asserts the entry has no Electron, BrowserWindow, or WebView dependency. `rg` verifies `packages/agent-runtime/src` has no Electron import. |
| Runtime readiness and health | `runtime-service.spec.ts` observes `starting`, `ready`, `degraded`, and `stopped`, including browser/backend separation and initialization/shutdown races. |
| Outbound backend Agent connection | `runtime-integration.spec.ts` exercises outage/reconnect and shared registration fixtures; `agent-client.test.ts` covers hello, registration, heartbeat, reconnect, invalid messages, and stop. |
| Agent-owned browser capability | `playwright-host.test.ts` covers authenticated and anonymous commands, crawler action shapes, unavailable/stopping errors, session shutdown, and UTF-8 payload bounds. `runtime-integration.spec.ts` rejects arbitrary script methods. |
| Exclusive local profile ownership | `instance-lock.spec.ts` covers instance plus profile-root ownership, live duplicate rejection, stale/PID-reuse recovery, and ownership-safe release. `browser-profile-store.test.ts` covers root containment and traversal rejection. |
| User-scoped local supervisor control | `control-protocol.spec.ts` covers versioned health/status/shutdown, exact nonce rejection, incompatible versions, bounded responses, Unix socket mode `0600`, and stable Windows named-pipe naming. |
| Single active runtime instance | `instance-lock.spec.ts` covers authoritative duplicate detection and stale record recovery; Electron main uses the same global runtime lock and probe. |
| Graceful runtime shutdown | `runtime-service.spec.ts`, `playwright-host.test.ts`, and `apps/agent/src/index.spec.ts` prove command rejection, context/session close, WebSocket stop, control socket removal, and lock release. |
| Electron compatibility adapter | `main-shell.test.ts` proves factory/service composition and conflict handling; `agent-client.test.ts` consumes the same parity fixtures as the headless integration test. |
| Sanitized local diagnostics | `observability.spec.ts` covers allowlisted fields, URL credential/query removal, Authorization/cookie/token/ticket/nonce redaction, raw-field exclusion, event bounds, and bounded retention. |

## Verification commands

- `pnpm --filter @cthutool/agent-runtime lint && pnpm --filter @cthutool/agent-runtime typecheck && pnpm --filter @cthutool/agent-runtime test`
- `pnpm --filter @cthutool/agent lint && pnpm --filter @cthutool/agent typecheck && pnpm --filter @cthutool/agent test`
- `pnpm --filter @cthutool/desktop lint && pnpm --filter @cthutool/desktop typecheck && pnpm --filter @cthutool/desktop test`
- `git diff --check`
- `openspec validate extract-local-agent-runtime --type change --strict --no-interactive`
