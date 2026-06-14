## ADDED Requirements

### Requirement: Desktop task center workspace
CthuDesktop SHALL provide a first-class Tasks workspace for pending user-action items.

#### Scenario: Tasks workspace is available
- **WHEN** the desktop renderer shell is loaded
- **THEN** the activity bar includes a Tasks workspace entry separate from Browser Profiles and Settings

#### Scenario: Pending count is visible
- **WHEN** there are actionable tasks with status `open`, `in_progress`, or `failed`
- **THEN** the Tasks workspace entry displays a pending count for those tasks

#### Scenario: No actionable tasks
- **WHEN** there are no actionable tasks
- **THEN** the Tasks workspace shows an empty state and the activity-bar entry does not display a positive pending count

### Requirement: Desktop task aggregation
CthuDesktop SHALL aggregate browser authentication tasks from backend browser status and local desktop pending-auth state into a unified renderer task model.

#### Scenario: Backend auth task is mapped
- **WHEN** backend browser status contains a pending auth task
- **THEN** the task center displays a `browser-auth` task with site id, profile name, reason, source, status, and updated time when available

#### Scenario: Local auth task is mapped
- **WHEN** local desktop pending-auth state contains a pending auth task
- **THEN** the task center displays a `browser-auth` task even if the backend status request is unavailable

#### Scenario: Duplicate auth tasks are merged
- **WHEN** backend and local state contain the same browser-auth task for the same site and profile
- **THEN** the task center displays one task row while preserving that the task is known from both sources

### Requirement: Browser auth task actions
CthuDesktop SHALL let the user act on browser authentication tasks from the task center using existing browser profile actions.

#### Scenario: User opens login from task
- **WHEN** the user selects Open Login on a browser-auth task
- **THEN** CthuDesktop invokes the existing browser login action for that task's site and profile

#### Scenario: User verifies profile from task
- **WHEN** the user selects Verify on a browser-auth task
- **THEN** CthuDesktop invokes the existing browser profile verification action for that task's site and profile

#### Scenario: Task action completes
- **WHEN** a task action completes successfully or fails with a structured browser error
- **THEN** the task center refreshes backend and local browser task state and displays the resulting status or error feedback

### Requirement: User-driven task handling
CthuDesktop SHALL notify the user about browser-auth tasks without automatically opening browser login windows.

#### Scenario: New auth task arrives
- **WHEN** backend or local refresh discovers a browser-auth task
- **THEN** CthuDesktop updates the Tasks workspace and pending count without opening a browser window

#### Scenario: Login requires explicit user action
- **WHEN** a browser-auth task is shown in the task center
- **THEN** the login browser window opens only after the user chooses the task's Open Login action

### Requirement: Task center presentation states
CthuDesktop SHALL present task lists in a way that supports scanning, failure recovery, and refresh.

#### Scenario: Tasks are grouped by status
- **WHEN** the task center has multiple tasks
- **THEN** it groups or sorts tasks so open, in-progress, and failed work is easier to scan than resolved work

#### Scenario: Backend status fails
- **WHEN** backend browser status cannot be fetched
- **THEN** the task center shows a recoverable error while still displaying local pending tasks

#### Scenario: Task data refreshes
- **WHEN** the user requests a task refresh
- **THEN** CthuDesktop reloads backend browser status and local pending-auth state before recomputing the task list
