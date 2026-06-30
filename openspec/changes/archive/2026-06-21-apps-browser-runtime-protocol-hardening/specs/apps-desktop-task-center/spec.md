## MODIFIED Requirements

### Requirement: Desktop task center workspace
CthuDesktop SHALL provide a first-class Tasks workspace for pending user-action items that are not browser-auth runtime challenges.

#### Scenario: Tasks workspace is available
- **WHEN** the desktop renderer shell is loaded and non-browser task-center capabilities remain enabled
- **THEN** the activity bar includes a Tasks workspace entry separate from Browser Profiles and Settings

#### Scenario: Pending count is visible
- **WHEN** there are actionable non-browser tasks with status `open`, `in_progress`, or `failed`
- **THEN** the Tasks workspace entry displays a pending count for those tasks

#### Scenario: No actionable tasks
- **WHEN** there are no actionable non-browser tasks
- **THEN** the Tasks workspace shows an empty state and the activity-bar entry does not display a positive pending count

### Requirement: Task center presentation states
CthuDesktop SHALL present non-browser task lists in a way that supports scanning, failure recovery, and refresh.

#### Scenario: Tasks are grouped by status
- **WHEN** the task center has multiple non-browser tasks
- **THEN** it groups or sorts tasks so open, in-progress, and failed work is easier to scan than resolved work

#### Scenario: Task data refreshes
- **WHEN** the user requests a task refresh
- **THEN** CthuDesktop reloads active non-browser task sources before recomputing the task list

## REMOVED Requirements

### Requirement: Desktop task aggregation
**Reason**: Browser authentication is no longer represented as backend or local pending-auth task state.
**Migration**: Browser/Douban surfaces render browser runtime status and operation-scoped challenges returned from the workflow that needs user action.

#### Scenario: Browser auth aggregation is removed
- **WHEN** backend browser status or local desktop browser state is refreshed
- **THEN** the task center does not create, merge, or display `browser-auth` task rows

### Requirement: Browser auth task actions
**Reason**: Browser login and verification actions now belong to browser runtime/profile surfaces or the active workflow that returned a challenge.
**Migration**: Invoke browser login or verification through explicit browser runtime actions tied to the public status or challenge being displayed.

#### Scenario: Browser auth task actions are removed
- **WHEN** the user needs to open login or verify a browser profile
- **THEN** the action is offered by the browser runtime/profile workflow instead of a task-center `browser-auth` task action

### Requirement: User-driven task handling
**Reason**: The user-driven behavior remains, but browser-auth notifications are no longer sourced from task rows.
**Migration**: Notify or render user action needs through browser runtime status and operation challenge UI.

#### Scenario: Browser auth task notification is removed
- **WHEN** a browser operation discovers that auth is required
- **THEN** CthuDesktop shows the operation-scoped challenge without creating a task-center notification that opens a pending task
