## Context

`apps/desktop` currently owns the Electron main/preload process and a React 18.3 renderer built with `electron-vite`. The renderer shell, page composition, state wiring, theme variables, and desktop host API access are concentrated in `src/renderer/src/App.tsx` and `src/renderer/src/styles.css`. This is workable for the first desktop console, but it creates friction for systematic visual improvements and for a future pure web frontend that should reuse business pages without exposing local desktop actions.

The repo already uses pnpm workspace packages and has a Tailwind/shadcn precedent in `scratches/collection-hub/web`, which already runs on React 19. This change establishes shared UI and runtime boundaries before broad page redesign work, and upgrades the desktop renderer to the React 19 stable line first so the new foundation starts on the same modern baseline.

## Goals / Non-Goals

**Goals:**

- Introduce a shared React UI package for shadcn-compatible primitives, Tailwind theme tokens, global CSS, and UI utilities.
- Introduce a shared app-shell runtime package for host-neutral page composition, navigation metadata, and runtime capability contracts.
- Upgrade `apps/desktop` renderer dependencies and types to the React 19 stable line.
- Refactor the desktop renderer so common pages use shared packages while Electron-specific behavior remains behind a desktop host adapter.
- Make future `apps/web` reuse possible without creating a second copy of desktop renderer pages.
- Preserve current desktop behavior while enabling incremental page-by-page migration.

**Non-Goals:**

- Do not implement the future `apps/web` application in this change.
- Do not redesign every desktop page or complete the visual refresh in one pass.
- Do not move Electron main/preload code into shared packages.
- Do not expose desktop-only capabilities, local filesystem paths, or window controls in web-safe shared pages.
- Do not change backend APIs except where existing renderer calls need a cleaner client boundary.

## Decisions

### Upgrade desktop to React 19 before shared UI migration

`apps/desktop` will update `react`, `react-dom`, `@types/react`, and `@types/react-dom` to the React 19 stable line before the shared UI package is adopted. This keeps the desktop renderer aligned with the future frontend direction and avoids building new shadcn/Tailwind primitives around an older app baseline.

Alternative considered: keep desktop on React 18.3 while shared packages support both versions. That reduces immediate upgrade work, but it leaves the most important consumer behind the intended UI foundation and pushes React 19 type fixes into later page migration.

### Create `packages/ui` for shadcn/Tailwind primitives

`packages/ui` will own copied shadcn-style primitives, `cn`, Tailwind global CSS, and semantic CSS variables. React will be a peer dependency compatible with React 18.3+ and React 19 so package consumers can migrate at their own pace, while `apps/desktop` uses React 19. Components must avoid Next.js-only APIs so they can run in `electron-vite`, Vite, and future web builds.

Alternative considered: keep shadcn components inside `apps/desktop`. That is faster for one app, but it would force a later extraction and make visual consistency harder once `apps/web` exists.

### Create a shared app-shell runtime package instead of sharing `apps/desktop` directly

A new shared runtime package will own host-neutral shell/page composition, navigation metadata, page components, and runtime capability types. It will not import Electron, preload types, or `window.cthutoolDesktop`. Desktop-specific shell surfaces such as window buttons can wrap or extend shared layout components from `apps/desktop`.

Alternative considered: make `apps/desktop/src/renderer` the canonical frontend source and import it from web later. That would leak desktop assumptions into the web frontend and make host-only UI easy to expose accidentally.

### Use host adapters for environment differences

Shared pages will receive capabilities and actions from a runtime adapter. The desktop adapter will bridge to preload APIs for window actions, local browser profile operations, app info, local paths, and connection state. A web adapter can later provide only HTTP-backed capabilities and omit host actions.

Alternative considered: use scattered `isDesktop` checks inside components. Centralized capabilities are easier to test and keep unavailable features from appearing in the wrong runtime.

### Migrate incrementally

The first implementation should add packages and move a narrow vertical slice of primitives/runtime wiring before migrating the whole renderer. The desktop overview, agents, browser profiles, and settings sections can then move page by page while renderer tests preserve behavior.

Alternative considered: rewrite `App.tsx` and all CSS in one change. That raises regression risk in an already active desktop/browser-auth worktree.

## Risks / Trade-offs

- React 19 upgrade can expose TypeScript or runtime compatibility issues in desktop tests -> Upgrade desktop before broad page migration and keep renderer tests green before adding shared runtime layers.
- Shared package dependency drift between React 18 scratch consumers and React 19 apps -> Keep React as a broad peer dependency and avoid framework-specific component code.
- Tailwind setup churn in Electron renderer -> Add Tailwind with a minimal renderer integration and keep current CSS behavior until tokens are migrated.
- Shared abstractions could become too generic too early -> Limit the runtime contract to known differences: runtime kind, capability flags, navigation, and host actions.
- Existing dirty worktree may contain active desktop/backend changes -> Scope implementation to the new change files and coordinate carefully before editing active source files.
- shadcn copy-paste components can diverge across apps -> Centralize owned primitives in `packages/ui` and prevent new app-local copies unless there is a documented exception.

## Migration Plan

1. Upgrade `apps/desktop` renderer React dependencies and types to the React 19 stable line, then resolve any test/type fallout.
2. Add `packages/ui` with Tailwind/shadcn utilities, global styles, and a small initial component set used by desktop.
3. Add the shared app-shell runtime package with host capability types, provider hooks, navigation metadata, and host-neutral page/shell building blocks.
4. Wire `apps/desktop` renderer to Tailwind and import shared styles without changing the Electron main/preload runtime contract.
5. Replace desktop-local primitive styling and selected shell/page pieces with shared components while preserving current tests.
6. Move desktop host actions behind a desktop adapter and update renderer tests to use adapter stubs.
7. Validate with desktop renderer tests, desktop typecheck, focused build checks, and visual smoke checks once the app can run.

Rollback is straightforward before page migration: remove the package imports and restore local CSS/component usage. After page migration starts, rollback should happen per migrated page to avoid losing unrelated desktop behavior.

## Open Questions

- Should the shared runtime package be named `@cthutool/app-shell` or a more explicit `@cthutool/frontend-runtime` during implementation?
- Should the first visual theme keep the current Dracula palette exactly, or normalize it immediately to shadcn's semantic token names with only minor color adjustments?
- Should future `apps/web` be Vite or Next.js? This change keeps shared packages framework-neutral so that decision can happen later.
