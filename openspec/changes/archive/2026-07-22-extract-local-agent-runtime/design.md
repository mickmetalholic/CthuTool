## Context

`apps/desktop` currently starts the backend-facing `AgentClient` and `PlaywrightHost` from the Electron main process. Most browser automation, profile, configuration, and observability code is already Node.js code, but lifecycle ownership and filesystem/process assumptions are tied to Electron startup. The migration needs a headless process contract before environment routing, a deployed Web/local bridge, tray, or CLI can control it.

This change is deliberately transitional: Electron remains usable while the same runtime core becomes executable without Electron. Existing backend and browser protocol behavior is the compatibility baseline.

## Goals / Non-Goals

**Goals:**

- Produce one Electron-independent implementation of agent connectivity and browser hosting.
- Add a headless Node.js entry point with explicit startup, readiness, health, and graceful shutdown states.
- Preserve browser profiles and observable browser behavior during extraction.
- Give future supervisors a small local control contract without coupling the runtime to a particular tray or installer.

**Non-Goals:**

- Building the tray, settings UI, release bundle, or `chc agent` commands.
- Adding environment selection, public-backend secrets, or Web bridge behavior.
- Replacing Playwright or supporting a system-wide/root daemon.

## Decisions

### Use a Node.js headless runtime and extract host-neutral modules

Create an `apps/agent` process (workspace package name finalized during implementation) that composes extracted `AgentClient`, `PlaywrightHost`, configuration, profile, and observability modules. Runtime modules receive explicit ports for paths, clocks, logging, and process signals; they do not import Electron.

This reuses the working Playwright implementation and ecosystem. Rewriting browser control in Rust would add large parity risk, while leaving it inside Electron would not solve the service boundary.

### Keep one owner for mutable local browser state

Only one Agent runtime may own the profile root and controlled browser contexts at a time. A user-scoped instance lock records the authoritative PID and random instance nonce. Electron compatibility mode starts the same core only when no standalone runtime owns it.

This avoids profile corruption and ambiguous command delivery. Running Electron and the standalone agent as independent browser hosts was rejected.

### Define a user-scoped local supervisor protocol

The runtime exposes a platform-local Unix socket or named pipe protected by operating-system user permissions, with a versioned handshake and instance nonce used to reject stale records. Minimum operations are `health`, `status`, `shutdown`, and retrieval of sanitized runtime facts. Readiness is emitted only after configuration is loaded, the profile store is locked, and browser capability initialization has completed.

The endpoint is not a public backend API and is not advertised outside the user session. It does not introduce a persisted credential lifecycle. A tiny protocol is preferred over stdin-only control because later CLI invocations need to locate an existing process; a general local RPC framework is unnecessary.

### Separate process health from backend connectivity

Runtime status distinguishes `starting`, `ready`, `degraded`, `stopping`, and `stopped` from backend connection states such as `connecting`, `online`, and `offline`. A healthy local process may be offline from the backend. This prevents supervisors from restarting a functional agent during network outages.

### Preserve data layout through an explicit resolver

Extract a user-data path resolver that can read the current Electron profile/config location and a future agent-owned location. This change does not destructively move data; it makes ownership and migration inputs explicit so the retirement change can perform a tested migration.

## Risks / Trade-offs

- [Electron and headless entry points drift] → Both compose the same runtime factory and share contract tests; Electron-specific code is limited to adapters.
- [Two processes open the same profile] → Acquire the instance/profile lock before initialization and fail with an actionable owner status.
- [A stale instance record targets another process] → Protect control IPC with user ACLs and validate PID, executable identity, nonce, and protocol handshake before acting.
- [A backend outage looks like a crashed service] → Model process readiness and backend connectivity separately.
- [Extraction creates a large review] → Move behavior in small modules and add characterization tests before altering ownership.

## Migration Plan

1. Add characterization tests around current agent connection, browser commands, profile resolution, and shutdown.
2. Extract Electron-free modules while keeping the Electron entry point as their first consumer.
3. Add the headless entry point, instance lock, user-scoped local control handshake, and parity tests.
4. Run Electron and headless modes separately against the same backend contracts; never run them simultaneously against the same profile root.
5. Roll back by retaining the Electron adapter and disabling the standalone entry point; no data migration occurs in this change.

## Open Questions

- Finalize the workspace folder/package split (`apps/agent` plus internal modules versus an additional reusable package) during implementation based on import graph boundaries.
- Finalize Unix domain socket versus named-pipe adapters after validating Windows support; the protocol contract remains transport-independent.
