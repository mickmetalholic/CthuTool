## REMOVED Requirements

### Requirement: Desktop workspace application
**Reason**: The Electron workspace application is retired after the local agent becomes independently installable.
**Migration**: Install and operate the tray-plus-agent through `chc agent`; use web applications for business workspaces.

### Requirement: Desktop backend connection configuration
**Reason**: Backend environment and Agent-secret configuration no longer belong to an Electron renderer.
**Migration**: Select trusted catalog environments in the tray or `chc agent env` workflows and configure per-environment static Agent secrets through protected CLI input.

### Requirement: Desktop WebSocket agent connection
**Reason**: The headless Agent owns the authenticated outbound connection for the active environment.
**Migration**: Use `apps-agent-runtime` with `apps-agent-environment-routing`, the single-user Agent access boundary, and the versioned shared protocol.

### Requirement: Desktop management home page
**Reason**: The windowed desktop management surface is removed from the local component.
**Migration**: Use `apps-web-agent-console` for management and local machine controls through `apps-agent-local-bridge`; use tray/CLI for environment selection.

### Requirement: Desktop console remains a frontend only
**Reason**: There is no Electron console renderer after retirement.
**Migration**: Keep frontend behavior in the independently deployed Web application and expose local machine controls only through the authenticated loopback bridge.

### Requirement: Agent console observable state
**Reason**: Desktop-console status presentation is replaced by tray, deployed Web, and CLI status.
**Migration**: Use tray status, `apps-web-agent-console` diagnostics through the local bridge, or `chc agent status` and `doctor`.
