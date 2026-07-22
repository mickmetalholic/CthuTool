## Context

The target application is a user-session Agent, not an interactive desktop workspace. It still needs a persistent, recognizable presence and simple controls for environment selection, opening the deployed Web application, and exiting. The tray must also own the child Agent lifecycle so users do not end up with an invisible orphan process.

The Node.js Agent remains responsible for browser control, environment switching, and the loopback bridge. The native component is intentionally narrow and has no application window or WebView.

## Goals / Non-Goals

**Goals:**

- Provide a lightweight native tray on supported desktop platforms.
- Supervise exactly one Agent child with bounded restart behavior and accurate status.
- Select exactly one configured environment and open its deployed Web route.
- Make Exit terminate both tray and Agent cleanly.

**Non-Goals:**

- Providing a settings window, embedded renderer, task pause mode, or tray-only idle mode.
- Editing environment endpoints or secrets in a native UI; those remain CLI/configuration concerns.
- Reimplementing Agent/browser logic in Rust or running as a privileged pre-login service.

## Decisions

### Use a standalone Rust tray executable

Use Rust with focused tray/menu, single-instance, process, and browser-open crates. Do not adopt Tauri because this change has no window or WebView. Final crate choices are pinned and audited during implementation, with platform differences kept behind small adapters.

### Make the tray the normal supervisor

On launch, the tray acquires a user-scoped single-instance lock, spawns the bundled Node.js runtime and Agent entry point, and waits for the versioned readiness handshake over protected same-user IPC. The handshake supplies a random instance nonce used with PID and executable checks to reject stale records; it is not a persistent local-control credential.

If an existing healthy tray is found, the second invocation asks it to open CthuTool and exits. A stale lock is recovered only after PID, executable, nonce, and control-handshake validation.

### Make environment selection explicit and authoritative

The menu contains a non-actionable status line, Open CthuTool, an Environment submenu with radio-style configured environments, and Exit. The checked environment is the Agent's active environment, not an independent tray preference.

Selecting another environment asks the Agent to execute its complete switch contract: close old commands and browser contexts, invalidate local bridge sessions, disconnect the old backend, change environment-scoped storage/profile roots, and reconnect. The tray stays alive and shows switching, ready, backend-offline, or error state. A request rejected before activation leaves the prior environment selected; once the target becomes active, authentication/connectivity failure leaves that target selected in degraded state and never falls back silently.

### Open the deployed Web application through the local bridge

Open CthuTool asks the Agent for a fresh one-time bridge ticket, combines the selected environment's exact `webAgentUrl` with `#endpoint=...&ticket=...&environment=...`, and opens the result in the default browser. The fragment is not sent to the deployed server. The tray never serves HTML and does not persist the short-lived bridge token.

Windows activates Open CthuTool on double-click where supported; macOS uses primary click; the context menu is the universal fallback. Linux may initially remain menu-only if desktop environments cannot provide consistent activation events.

### Use bounded restart and coordinated exit

Unexpected child exits are restarted with exponential backoff and a crash-window limit. Backend disconnection does not trigger restart. After the limit, the tray remains present in an error state and still offers environment selection, Open CthuTool when the bridge is available, and Exit.

Exit sends same-user graceful shutdown through the validated local supervisor channel, waits for controlled browser contexts and profile locks to close, and terminates only the exact child after a timeout. There is no stop-tasks-but-keep-tray state.

## Risks / Trade-offs

- [Tray behavior differs by OS] -> Require the context menu as the universal fallback.
- [Environment switching strands commands or browser state] -> Delegate switching to the Agent's atomic environment contract and display transitional state.
- [Agent crash loop consumes resources] -> Use exponential backoff, a restart budget, and a latched error state.
- [PID reuse terminates another process] -> Validate the instance record, executable path, nonce, and same-user control handshake before acting.
- [Browser launch data leaks] -> Put bridge bootstrap material only in the fragment and issue a single-use short-lived ticket.

## Migration Plan

1. Implement single-instance and mock-child supervision against the same-user control contract.
2. Integrate environment status/switching and one-time deployed-Web launch issuance.
3. Add tray interaction and coordinated-shutdown tests on macOS and Windows runners.
4. Distribute the tray through the release-artifact change while Electron remains available for validation.
5. Roll back by launching the headless runtime directly for development or returning users to Electron; environment-scoped data remains Agent-owned.

## Open Questions

- Linux tray support is deferred until a target desktop support matrix is agreed.
- Final icon variants and accessibility labels require a small platform visual pass but do not expand the interaction model.
