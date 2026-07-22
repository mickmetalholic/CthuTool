## REMOVED Requirements

### Requirement: Desktop agent observability
**Reason**: The Electron agent lifecycle is retired.
**Migration**: Use headless Agent events surfaced through the deployed Web local bridge, tray state, and CLI diagnostics.

### Requirement: Desktop browser host observability
**Reason**: Browser commands and runtime diagnostics are agent-owned after extraction.
**Migration**: Use sanitized `apps-agent-runtime` browser events and `chc agent logs`/`doctor`.

### Requirement: Desktop safe local diagnostics
**Reason**: Diagnostic safety is no longer specific to the desktop app.
**Migration**: Preserve redaction and shared field requirements in the Agent runtime, local bridge, and Web console specifications.

### Requirement: Desktop diagnostics and observability contract
**Reason**: The desktop local-first event contract is superseded by the installed agent diagnostics contract.
**Migration**: Store redacted events in environment-scoped Agent log roots and expose them through the authenticated loopback bridge and CLI.
