## ADDED Requirements

### Requirement: Agent registry is transport-only
The backend agent registry SHALL own only desktop client connection lifecycle, public client metadata, online status, heartbeat freshness, and capability advertisement.

#### Scenario: Browser-capable agent registers
- **WHEN** a desktop agent registers with browser capability
- **THEN** the registry stores the browser capability string as public agent metadata without storing browser profiles, pending auth tasks, browser diagnostics, or browser page state

#### Scenario: Capability-specific message arrives
- **WHEN** a registered desktop agent sends a capability-specific message
- **THEN** the registry delegates or ignores the message according to transport routing policy without mutating capability state in registry storage

## REMOVED Requirements

### Requirement: Browser state snapshot WebSocket messages
**Reason**: Browser state snapshots make the agent registry aware of browser profile and pending-auth state, which violates the transport-only boundary.

**Migration**: Browser profile/status reads move to on-demand desktop browser runtime commands, and browser auth workflows return operation-scoped interaction challenges.

### Requirement: Agent registry delegates capability state
**Reason**: The registry no longer participates in capability state projection.

**Migration**: Capability modules own their own read models or query their runtime on demand. The browser capability uses `apps-backend-desktop-browser-runtime`.
