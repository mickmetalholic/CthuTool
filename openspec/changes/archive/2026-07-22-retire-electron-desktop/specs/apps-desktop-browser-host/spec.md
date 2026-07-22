## REMOVED Requirements

### Requirement: Desktop browser capability
**Reason**: Browser capability is no longer hosted by Electron.
**Migration**: Use the equivalent capability advertisement from `apps-agent-runtime`.

### Requirement: Controlled browser command handling
**Reason**: Controlled commands move to the headless browser host.
**Migration**: Use `apps-agent-runtime` with the browser protocol and active-environment command gateway.

### Requirement: Desktop browser profile store
**Reason**: Electron no longer owns profile storage.
**Migration**: Resolve a trusted environment, migrate profiles non-destructively to its Agent-owned profile root, and manage them through the deployed Web console and local bridge.

### Requirement: Desktop login and verification flow
**Reason**: Login and verification are agent browser-runtime responsibilities after cutover.
**Migration**: Launch and inspect login/verification through the headless runtime and deployed Web profile controls over the local bridge.

### Requirement: Browser launch visibility
**Reason**: Electron-specific browser launch ownership is removed.
**Migration**: Preserve the same hidden-capture, hidden-verification, and visible-login policy in `apps-agent-runtime`.

### Requirement: Anonymous browser access
**Reason**: Anonymous access no longer requires an Electron host.
**Migration**: Use the agent runtime's equivalent anonymous browser execution without creating profiles.

### Requirement: Browser execution limits
**Reason**: Execution limits move with browser hosting to the headless agent.
**Migration**: Preserve timeout, resource-blocking, and artifact-bound requirements in `apps-agent-runtime` and browser protocol tests.

### Requirement: Desktop host Chrome runtime
**Reason**: Host Chrome discovery is no longer desktop-app state.
**Migration**: Use Agent runtime Chrome discovery and deployed Web/CLI diagnostics.

### Requirement: CthuDesktop-owned browser profiles
**Reason**: Profile ownership moves from the CthuDesktop product identity to CthuAgent.
**Migration**: Copy and validate legacy profiles into the resolved environment-scoped Agent data root while retaining originals for rollback.

### Requirement: Site-specific browser profile verification
**Reason**: Verification remains behavior of the browser host, but the host is no longer Electron.
**Migration**: Preserve site-specific and generic verifiers in the extracted agent browser runtime.

### Requirement: Douban profile verifier
**Reason**: The verifier moves with browser automation to the headless agent.
**Migration**: Preserve its public verification outcomes and raw-auth-data protections in `apps-agent-runtime`.

### Requirement: Douban login status display
**Reason**: Electron renderer status display is removed.
**Migration**: Expose the same public verification state through the deployed Web profile section over the local bridge without raw auth data.

### Requirement: Browser host protocol correlation
**Reason**: Protocol correlation is no longer desktop-host-specific.
**Migration**: Preserve correlation in the headless runtime, shared agent protocol, and browser runtime protocol.

### Requirement: Browser host command observability
**Reason**: Command diagnostics move to agent-owned observability.
**Migration**: Use sanitized Agent runtime events surfaced through the deployed Web bridge and `chc agent doctor`/logs.

### Requirement: Desktop-owned browser sessions
**Reason**: Electron no longer owns controlled browser sessions.
**Migration**: Use Agent-owned sessions routed through the active environment's registered Agent connection.

### Requirement: Controlled browser action runner
**Reason**: The action runner is extracted from the Electron process.
**Migration**: Preserve supported action ordering and arbitrary-script rejection in `apps-agent-runtime`.

### Requirement: Desktop browser session limits
**Reason**: Session lifecycle limits belong to the headless agent after cutover.
**Migration**: Preserve timeout, TTL cleanup, and local-only sensitive state in the agent browser host.

### Requirement: Desktop crawler action execution
**Reason**: Crawler actions are no longer executed by an Electron desktop host.
**Migration**: Preserve supported action validation and arbitrary-script rejection in the agent runtime.

### Requirement: Desktop crawler extraction
**Reason**: Extraction behavior moves to the headless browser runtime.
**Migration**: Use equivalent selector, structured-list, and metadata extraction commands through the active environment command gateway.

### Requirement: Desktop crawler interaction and waiting
**Reason**: Interaction and waiting are no longer desktop-specific.
**Migration**: Preserve supported interaction/wait behavior and access-control limits in the agent runtime.

### Requirement: Desktop crawler payload limits
**Reason**: Payload and timeout limits move with crawler execution to the agent.
**Migration**: Preserve bounded extraction results and action timeouts in the headless runtime contract.
