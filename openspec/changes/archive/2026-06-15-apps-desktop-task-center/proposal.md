## Why

CthuDesktop currently spreads browser authentication work across the Browser workspace and backend status tables, so the user has to inspect a feature-specific page to notice that action is needed. A desktop task center gives the app a single place to surface pending work, starting with browser login tasks while leaving room for future backend and agent tasks.

## What Changes

- Add a first-class Tasks workspace to the desktop shell with a visible pending-count signal in the activity bar.
- Introduce a renderer-level task model that normalizes backend and local browser authentication tasks into task-center rows.
- Display open, in-progress, and failed browser-auth tasks with site, profile, source, reason, and last-updated context.
- Let the user start existing browser auth actions, such as opening login and verifying the profile, from task rows.
- Keep login user-driven: receiving or discovering a task SHALL NOT automatically open a browser window.
- Keep Browser Profiles focused on site/profile management while the Tasks workspace becomes the primary place for pending user action.

## Capabilities

### New Capabilities
- `apps-desktop-task-center`: Desktop task-center workspace, task aggregation model, task counts, and user-driven task actions.

### Modified Capabilities
- None.

## Impact

- Affects the desktop renderer shell navigation, task-center UI, browser status aggregation, and renderer tests.
- Reuses existing desktop IPC browser actions and backend browser status APIs.
- Does not introduce new backend persistence, automatic login prompting, or new browser automation commands in this change.
