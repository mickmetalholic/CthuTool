## Why

CthuTool needs a browser-based management console that can stand beside the Electron desktop app without duplicating product pages. Creating the `apps/web` project first gives the repo a clear Next.js host target while keeping shared page extraction and visual content work in separate changes.

## What Changes

- Add a new `apps/web` workspace app as the future CthuTool web management console host.
- Use Next.js, TypeScript, Tailwind CSS, and shadcn/ui-compatible setup for the project scaffold.
- Name all frontend-host documentation and future references `apps/web` instead of `apps/frontend`.
- Keep this change limited to project creation, wiring, and placeholder-safe documentation.
- Do not implement real management-console pages, business workflows, or visual content in this change.
- Do not modify existing shared UI/runtime packages or desktop renderer behavior in this change.

## Capabilities

### New Capabilities

- `apps-web-project-shell`: Defines the `apps/web` project scaffold, workspace integration, dependency baseline, and host boundary for the future web management console.

### Modified Capabilities

None.

## Impact

- Affected workspace app: new `apps/web`.
- Affected repository metadata: workspace lockfile and any root/turbo configuration required for the new app to participate in install, build, lint, and typecheck workflows.
- Affected documentation: OpenSpec artifacts and project references should consistently use `apps/web` for the web host.
- Explicitly out of scope: shared UI package implementation, shared page migration, desktop renderer refactors, backend API changes, and real web page content.
