## REMOVED Requirements

### Requirement: Desktop task center workspace
**Reason**: The current task center only contains browser-auth work, so a first-class generic Tasks workspace creates product surface area before a broader task model exists.
**Migration**: Surface browser-auth attention in Home and Browser Host. Reintroduce a task center later through a separate proposal when there are multiple task types or a generic task lifecycle.

### Requirement: Desktop task aggregation
**Reason**: Browser-auth aggregation remains useful, but it should be an internal browser attention model rather than a user-facing generic task-center contract.
**Migration**: Keep backend and local browser-auth state merging where needed for Home and Browser Host displays.

### Requirement: Browser auth task actions
**Reason**: Browser auth actions remain valid, but their user-facing home moves from Tasks to Browser Host.
**Migration**: Invoke the existing browser login, verify, and clear-profile actions from Browser Host rows or attention cards.

### Requirement: User-driven task handling
**Reason**: The explicit-user-action constraint is still required for browser auth, but it belongs to the Browser Host capability rather than a removed Tasks workspace.
**Migration**: Preserve user-driven login behavior under the Browser Host requirements.

### Requirement: Task center presentation states
**Reason**: A generic task list presentation is deferred until a real task center is designed.
**Migration**: Browser-auth loading, empty, error, and refresh states move to Home readiness summaries and Browser Host management surfaces.
