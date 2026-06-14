## 1. Task Model

- [x] 1.1 Define a renderer-level `DesktopTask` model for browser-auth tasks.
- [x] 1.2 Implement aggregation from backend pending auth tasks and local pending auth tasks.
- [x] 1.3 Deduplicate backend/local auth tasks for the same site and profile.
- [x] 1.4 Compute actionable task counts for `open`, `in_progress`, and `failed` tasks.

## 2. Shell Navigation

- [x] 2.1 Add a top-level Tasks workspace to the desktop activity bar.
- [x] 2.2 Display the actionable task count as a compact activity-bar badge.
- [x] 2.3 Preserve existing Browser Profiles and Settings navigation behavior.

## 3. Task Center UI

- [x] 3.1 Build a Tasks workspace panel with empty, loading, and recoverable error states.
- [x] 3.2 Render browser-auth task rows with title, site id, profile name, source, reason, status, and updated time when available.
- [x] 3.3 Group or sort task rows so open, in-progress, and failed work is easiest to scan.
- [x] 3.4 Keep Browser Profiles focused on site and profile management while task triage lives in the Tasks workspace.

## 4. Task Actions

- [x] 4.1 Wire Open Login task actions to the existing desktop browser login API.
- [x] 4.2 Wire Verify task actions to the existing desktop browser verification API.
- [x] 4.3 Refresh backend browser status and local pending-auth state after each task action.
- [x] 4.4 Show success, warning, and structured error feedback for task actions.
- [x] 4.5 Ensure new tasks update UI state without automatically opening a browser window.

## 5. Verification

- [x] 5.1 Add renderer unit coverage for task aggregation, deduplication, and actionable counts.
- [x] 5.2 Add renderer tests for the Tasks workspace, badge count, empty state, and auth task actions.
- [x] 5.3 Run focused desktop tests for renderer behavior.
- [x] 5.4 Run desktop typecheck.
- [x] 5.5 Run OpenSpec validation for this change.
