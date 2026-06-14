## Context

CthuDesktop already has a product shell, backend agent connection, browser profile management, and browser authentication tasks. Pending browser-auth work is currently visible only in the Browser workspace, and the renderer merges backend and local pending-auth data close to the Browser UI. The next step is to make user-action work visible as a first-class desktop concern without moving browser ownership out of the browser host.

The first task-center version should be deliberately small: it should aggregate existing browser-auth task sources, expose them in a new Tasks workspace, and reuse existing browser actions. It should not introduce a new backend task API, automatic login prompting, or task persistence beyond what the existing browser services already provide.

## Goals / Non-Goals

**Goals:**
- Add a first-class Tasks workspace and activity-bar pending count to CthuDesktop.
- Normalize existing local and backend pending browser-auth records into a renderer task model.
- Let the user start login and verification from task-center rows.
- Keep Browser Profiles focused on profile/site management rather than pending-work triage.
- Preserve the user-driven login flow: tasks notify, but do not open browser windows by themselves.

**Non-Goals:**
- No backend task persistence or generic backend task service.
- No automatic login window opening when a task arrives.
- No WebSocket push protocol for task events in this change.
- No new browser automation commands or site verification rules.
- No cross-device task assignment UI beyond the existing backend/local task sources.

## Decisions

1. Introduce a renderer-level `DesktopTask` model instead of a backend task model.

   The task center needs a stable UI contract before the backend has a general task service. The renderer can map backend pending-auth tasks and local pending-auth tasks into a shared shape with type, source, status, severity, title, site id, profile name, reason, and updated time. This keeps the first version low-risk and allows a future backend task API to replace the mapper later.

2. Add a Tasks workspace as a top-level activity-bar item.

   Pending user action is app-wide, not a Browser subpage. A top-level entry makes outstanding work visible without forcing the user to remember which feature owns it. The badge count should include actionable `open`, `in_progress`, and `failed` tasks, while resolved tasks should not contribute to the count.

3. Keep browser-auth actions delegated to existing desktop APIs.

   Task rows should call the same `openBrowserLogin`, `verifyBrowserProfile`, and refresh paths used by Browser Profiles. This avoids duplicating Playwright or profile logic in the renderer and keeps the desktop main process as the boundary for host browser operations.

4. Keep Browser Profiles as management, not triage.

   Browser Profiles can continue to show sites and profile summaries, but the task-center workspace becomes the primary place to review pending auth work. If the Browser page still shows pending tasks, it should be secondary and consistent with the task-center model.

## Risks / Trade-offs

- [Risk] Renderer-only aggregation can briefly diverge from backend state after connection changes. -> Mitigation: reuse existing refresh cadence and manual refresh paths, and recompute tasks from the latest backend/local snapshots.
- [Risk] Task Center may look generic while only browser-auth tasks exist. -> Mitigation: label the workspace as Tasks, but make the empty state and rows explicit about browser authentication in this first version.
- [Risk] Duplicate local and backend tasks could appear for the same site/profile. -> Mitigation: deduplicate by task type, site id, profile name, and agent/source preference, while preserving whether the task came from backend, local, or both.
- [Risk] Adding another top-level workspace can clutter navigation. -> Mitigation: use the existing activity-bar pattern and a compact badge rather than adding another left-side subnav.
