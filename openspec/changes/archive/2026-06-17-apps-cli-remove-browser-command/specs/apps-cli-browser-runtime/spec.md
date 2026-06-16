## REMOVED Requirements

### Requirement: Browser runtime diagnostics
**Reason**: CthuDesktop owns local browser runtime status, and the CLI browser diagnostic wrapper is no longer a supported browser surface.
**Migration**: Use CthuDesktop local status for regular browser runtime troubleshooting. Developers can inspect Desktop logs or backend APIs directly when deeper troubleshooting is needed.

### Requirement: No browser install command
**Reason**: The entire CLI browser command group is removed, so a separate requirement for the absence of one browser subcommand is unnecessary.
**Migration**: Browser runtime setup remains a CthuDesktop concern. Install or configure host Google Chrome through Desktop-supported setup paths.

### Requirement: Browser runtime status output
**Reason**: Backend browser status remains available through backend APIs and Desktop UI, but the CLI no longer wraps that status behind `chc browser status`.
**Migration**: Regular users use CthuDesktop browser status and task-center surfaces. Developers can call backend browser status APIs directly for troubleshooting.
