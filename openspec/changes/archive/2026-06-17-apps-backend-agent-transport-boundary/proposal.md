## Why

Backend agent modules currently mix transport responsibilities with browser-specific workflow state and command handling. This makes the agent layer harder to reason about and encourages future capabilities to leak business logic into the connection substrate.

## What Changes

- Reorganize backend agent code under an agent-owned module area that only covers desktop client connection lifecycle, public client metadata, online status, capability advertisement, and generic typed command transport.
- Make the agent command gateway typed and generic, so agent code correlates commands and responses without importing or branching on browser-specific command/result types.
- Introduce a reusable `desktop-browser-runtime` backend module as the browser capability access layer for backend services and future clients.
- Group browser backend modules under a browser-owned module area, with capability-specific routes and services owned by `browser/content`, `browser/auth`, `browser/sites`, and `browser/desktop-runtime`.
- Remove `browser-automation` as a standalone domain/composition module; move its public routes into the browser capability modules that own the behavior.
- Replace server-side browser profile and pending-auth-task mirrors with on-demand desktop browser runtime queries and operation-scoped interaction challenges.
- Remove agent-owned browser snapshot projection and browser pending command handling from agent registry/WebSocket code.
- Keep browser content retrieval, browser auth, diagnostics, site config resolution, and Douban workflows behind browser/business modules rather than agent modules.

## Capabilities

### New Capabilities

- `apps-backend-desktop-browser-runtime`: Defines the reusable backend module for desktop browser capability access through the generic agent command gateway, including capture, login, verification, profile/status lookup, and runtime diagnostics contracts.

### Modified Capabilities

- `apps-backend-agent-registry`: Limit registry/WebSocket behavior to connection lifecycle, registration, heartbeat, online status, public client metadata, and capability advertisement; remove browser snapshot routing and browser command response handling from registry responsibilities.
- `apps-backend-agent-command-gateway`: Generalize command dispatch to typed capability commands without browser-specific method names, payload/result imports, or business command mapping.
- `apps-backend-agent-state`: Remove capability-specific browser profile and pending-auth projection from agent state; agent state is limited to agent-owned connection and public client status, or folded into the registry boundary if no separate state module remains necessary.
- `apps-backend-browser-agent-capture`: Replace the agent-named browser capture module with `apps-backend-desktop-browser-runtime` ownership so browser capture execution is modeled as a desktop browser runtime capability rather than an agent capability module.
- `apps-backend-browser-auth`: Stop reading or writing server-mirrored browser profile/pending-task state; query desktop browser runtime on demand and return operation-scoped user-interaction challenges when login or verification is required.
- `apps-backend-browser-content`: Consume desktop browser runtime for capture execution and represent auth-required outcomes as structured detection/challenge results without mutating agent-owned state.
- `apps-backend-browser-automation`: Remove this as a standalone browser domain module and move its routes/exports into owning browser capability modules.
- `apps-backend-sites-config`: Preserve effective site config behavior while moving browser-facing site APIs under the browser sites module organization.

## Impact

- Affected backend code: `apps/backend/src/modules/agent-*`, `apps/backend/src/modules/browser-*`, `apps/backend/src/modules/sites-config`, and imports from `apps/backend/src/app.module.ts`.
- Affected protocol usage: backend agent transport should use generic typed command envelopes while browser-specific command contracts move behind `desktop-browser-runtime`.
- Affected API behavior: browser sites/profile/auth routes move to owning browser modules; profile and pending-auth task endpoints may be removed or replaced by on-demand status/challenge endpoints.
- Affected specs: existing backend agent and browser specs require deltas to remove browser logic from agent modules and define the desktop browser runtime boundary.
- Migration risk: current desktop and renderer consumers may depend on pending-auth-task or profile-list endpoints and will need compatibility handling or explicit API replacement during implementation.
