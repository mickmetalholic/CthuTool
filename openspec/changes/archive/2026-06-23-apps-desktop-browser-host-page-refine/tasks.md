## 1. Renderer State Model

- [x] 1.1 Add a Browser Host display model that derives runtime readiness, pending-auth attention, managed profile rows, and empty/error/loading states from existing browser status and local pending-auth data.
- [x] 1.2 Track browser profile action feedback by site/profile/action target so running, success, and error states can render beside the affected row.
- [x] 1.3 Preserve existing backend status refresh, local pending-auth refresh, and explicit browser action behavior without adding new APIs or IPC contracts.

## 2. Browser Host Page Structure

- [x] 2.1 Reorganize Browser Host content so runtime readiness appears first, browser-auth attention appears next, and managed profiles appear as the primary inspection surface.
- [x] 2.2 Add a concise attention summary that shows affected site/profile names, reason, source, and next actions for pending browser-auth items.
- [x] 2.3 Add a ready/empty state for browser-auth attention when no pending items exist.
- [x] 2.4 Keep local pending-auth attention visible when backend browser status loading or failure occurs.
- [x] 2.5 Keep logs and generic Tasks workspace behavior out of this page refinement.

## 3. Managed Profile Rows and Actions

- [x] 3.1 Update managed profile rows to show site name, profile name, verification state, public account metadata, and required action availability in a stable scanning layout.
- [x] 3.2 Render Open Login, Verify, and Clear as explicit row actions for required-auth profiles.
- [x] 3.3 Render per-row action progress, success, and error feedback after browser actions complete or fail.
- [x] 3.4 Preserve page-level recoverable error feedback for unexpected browser status or action failures.

## 4. Styling and Responsiveness

- [x] 4.1 Update desktop renderer CSS for the revised Browser Host sections, profile rows, attention summary, and row-level feedback.
- [x] 4.2 Ensure Browser Host layout remains readable in narrow renderer widths without overlapping text or resizing stable controls.
- [x] 4.3 Keep visual treatment consistent with the current desktop shell and shared UI primitives.

## 5. Tests and Validation

- [x] 5.1 Update renderer tests for Browser Host section ordering and runtime readiness visibility.
- [x] 5.2 Add or update renderer tests for pending browser-auth attention summary, empty state, and local fallback during backend status failure.
- [x] 5.3 Add or update renderer tests for per-row Open Login, Verify, Clear action feedback.
- [x] 5.4 Run `pnpm --filter @cthutool/desktop test`.
- [x] 5.5 Run `pnpm --filter @cthutool/desktop typecheck`.
- [x] 5.6 Run `pnpm --filter @cthutool/desktop build`.
- [x] 5.7 Run `openspec validate apps-desktop-browser-host-page-refine --strict --type change --no-interactive`.
