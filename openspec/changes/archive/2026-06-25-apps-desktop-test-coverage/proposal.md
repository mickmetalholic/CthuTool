## Why

Desktop is the highest-risk visibility-only package because it owns Electron main process behavior, browser profile persistence, Playwright host orchestration, and renderer workflows. Recent Windows CI failures showed that platform-specific file and auth-flow behavior needs stronger test coverage before desktop can be considered for coverage gates.

## What Changes

- Expand desktop runtime tests for browser profile persistence, pending auth tasks, Playwright host verification flows, and renderer workflows.
- Cover Windows-sensitive profile metadata replacement and auth verification behavior.
- Add coverage for existing desktop behavior without changing user-facing desktop features.
- Record the desktop coverage baseline after tests are expanded and decide whether desktop is ready to graduate from visibility-only coverage.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-root-engineering-config`: add desktop-specific runtime coverage expectations and graduation criteria.

## Impact

- `apps/desktop/src/main/**`, `apps/desktop/src/renderer/**`, and `apps/desktop/tests/**`.
- Desktop Vitest coverage output and the root coverage policy documentation.
- No change to `@cthutool/cli`, backend, shared packages, or `scratches/collection-hub`.
