## Why

CthuDesktop's renderer is ready for UI work, but its current shell, pages, theme tokens, and host APIs are still tightly coupled inside the desktop app. Building a shared shadcn/Tailwind foundation now will let the desktop renderer improve incrementally while keeping future pure web frontends from duplicating the same pages or accidentally exposing desktop-only host actions.

## What Changes

- Add a repo-owned shared UI package for shadcn-compatible components, Tailwind styling, semantic theme tokens, and small UI utilities.
- Add a host-neutral shared frontend runtime layer for app pages, navigation models, and runtime capability checks.
- Upgrade the CthuDesktop renderer from React 18.3 to the current React 19 stable line before building the shared UI/runtime foundation.
- Update CthuDesktop renderer expectations so desktop-only window controls, local path display, and local browser-profile actions are gated by a desktop host adapter instead of being embedded directly in shared pages.
- Prepare for a future `apps/web` app to reuse shared pages while hiding or disabling host-only capabilities.
- Keep this change focused on foundation and migration boundaries; visual polish can land incrementally after shared primitives and runtime contracts exist.

## Capabilities

### New Capabilities

- `packages-ui-shared-components`: Shared shadcn/Tailwind component primitives, theme tokens, global styles, and UI utility exports for workspace React apps.
- `packages-app-shell-runtime`: Shared host-neutral app shell, page composition, navigation metadata, and runtime capability contracts consumed by desktop now and a future web frontend later.

### Modified Capabilities

- `apps-desktop-product-shell`: Desktop shell requirements change to use the React 19 stable line, consume shared UI/runtime primitives, and gate desktop-only controls through a desktop host adapter.

## Impact

- Affected workspace packages: `apps/desktop`, new `packages/ui`, and new shared frontend runtime package.
- Affected renderer code: `apps/desktop/src/renderer/src/App.tsx`, renderer styles, desktop API access, and renderer tests.
- Affected dependencies: React, React DOM, React type packages, Tailwind CSS, shadcn-compatible helper dependencies such as `class-variance-authority`, `clsx`, `tailwind-merge`, and selected Radix UI packages as components are introduced.
- Affected future systems: a future `apps/web` should consume the shared runtime with a web adapter instead of copying desktop renderer pages.
