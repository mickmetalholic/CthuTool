## REMOVED Requirements

### Requirement: Electron compatibility adapter
**Reason**: The standalone tray-owned Agent is now the only supported local runtime, so the migration-period compatibility host is removed.
**Migration**: Install and operate the Agent through `chc agent`; use retained legacy data and the identified last Desktop artifact only during the bounded rollback window.
