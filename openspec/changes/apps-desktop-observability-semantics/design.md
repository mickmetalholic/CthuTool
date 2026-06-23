## Context

CthuDesktop owns local agent connectivity, browser profile state, Playwright runtime selection, and renderer diagnostics. These areas already expose status in several places, but they do not share one observability vocabulary or safe local logging contract.

## Goals / Non-Goals

**Goals:**
- Define local event semantics for agent lifecycle, browser command execution, runtime diagnostics, and renderer-visible status.
- Preserve backend command correlation when protocol metadata is available.
- Keep sensitive browser profile data and captured artifacts out of logs and UI diagnostics.

**Non-Goals:**
- Uploading desktop telemetry to a remote service.
- Changing user-driven login, verification, or browser command permissions.
- Building a full local log viewer beyond the semantics needed for one.

## Decisions

1. Split desktop observability into main-process events and renderer-safe summaries.
   - Rationale: The main process sees runtime and command details; the renderer should receive only safe status.
   - Alternative considered: expose raw main-process logs to the renderer. This would risk leaking paths and browser internals.

2. Treat command id as the minimum correlation field.
   - Rationale: Command id already exists and works before protocol-level request metadata is added.
   - Alternative considered: wait for protocol metadata before any desktop diagnostics. That blocks useful local debugging.

3. Keep browser host detection behavior observable but not self-healing.
   - Rationale: Observability should explain login-required, captcha, rate-limit, and blocked states without bypassing controls.
   - Alternative considered: automatically open visible login windows or retry aggressively. That changes product behavior.

## Risks / Trade-offs

- Renderer diagnostics may duplicate backend status -> define concise summaries and avoid repeating raw details across pages.
- Local logs can reveal user paths -> redact or summarize paths by default.
- Agent reconnect noise can overwhelm logs -> emit state transitions and sampled heartbeat summaries rather than every heartbeat in normal mode.

## Migration Plan

1. Define desktop event names and safe payload shape.
2. Add agent-client and browser-host diagnostic events.
3. Expose safe summaries through existing renderer runtime APIs.
4. Update Settings and agent console surfaces to consume summaries.
5. Keep feature behavior unchanged and allow diagnostics verbosity to be configured.

## Open Questions

- Should local log persistence be included in the first implementation or left as console-only diagnostics?
- Which desktop diagnostics should be visible in Settings by default?
- How much of the backend request context should be displayed to users versus kept for debugging?
