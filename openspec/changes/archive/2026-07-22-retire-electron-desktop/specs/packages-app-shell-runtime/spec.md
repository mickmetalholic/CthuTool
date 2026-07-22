## REMOVED Requirements

### Requirement: Host-neutral runtime contract
**Reason**: The package was only consumed by the retired Electron renderer.
**Migration**: Use Web-owned state and the typed Agent bridge client for local capabilities.

### Requirement: Shared page composition
**Reason**: No live application consumes the shared shell composition.
**Migration**: Own page navigation and composition in the deployed Web application.

### Requirement: Environment-specific rendering
**Reason**: Local and Web UI are no longer two renderers of one package.
**Migration**: The tray owns environment selection and the Web app renders bridge availability explicitly.

### Requirement: Web-safe default adapter
**Reason**: The Web app uses its own backend and Agent bridge clients.
**Migration**: Keep network and loopback capabilities behind typed clients in `apps/web`.

### Requirement: Testable runtime adapters
**Reason**: The retired package no longer provides runtime adapters.
**Migration**: Test the Agent bridge client and Web state boundaries directly.

### Requirement: Shared page frame composition
**Reason**: The Electron/Web shared page-frame experiment has no remaining consumer.
**Migration**: Own responsive page frames in the deployed Web application.

### Requirement: Shared status and notice patterns
**Reason**: The shared shell package is removed with its only consumer.
**Migration**: Implement status and notice patterns in Web-owned components when needed.

### Requirement: Shared shell pieces remain capability-aware
**Reason**: There is no shared local/Web shell after cutover.
**Migration**: Gate local controls on negotiated Agent bridge capabilities in the Web app.

### Requirement: Runtime observable state
**Reason**: Observable state no longer crosses a shared shell runtime.
**Migration**: Read sanitized state through backend APIs and the authenticated local bridge.

### Requirement: Runtime console diagnostics contract
**Reason**: The retired package no longer owns frontend logging.
**Migration**: Use Web-owned observability with shared redaction rules.

### Requirement: Shared frontend logger
**Reason**: The shared shell logger has no live consumer.
**Migration**: Keep structured, redacted Web logging in `apps/web`.

### Requirement: Shared observable status presentation
**Reason**: Status presentation is now owned by tray, deployed Web, and CLI.
**Migration**: Use tray summary, Web diagnostics through the bridge, or `chc agent status` and `doctor`.
