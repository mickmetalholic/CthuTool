## 1. Audit And Boundaries

- [x] 1.1 Review current desktop renderer shell, page, task, browser, agents, and settings markup to identify reusable UI patterns and behavior-sensitive seams.
- [x] 1.2 Confirm neighboring untracked OpenSpec changes and renderer files are unrelated or intentionally excluded before editing.
- [x] 1.3 Capture current desktop renderer test coverage for shell navigation, settings save, task actions, browser actions, and stale preload fallback behavior.
- [x] 1.4 Inventory current connection-status placements and decide which data belongs in the titlebar summary, bottom context bar, Overview metrics, and Settings detail surface.
- [x] 1.5 Inspect desktop main-process window creation/restoration and config normalization tests before changing sizing behavior.

## 2. Shared UI Primitives

- [x] 2.1 Define the active retro-futuristic dark neon token map for shell, workspace, panel, repeated item, border, text, accent, glow, and status roles.
- [x] 2.2 Add shared icon button primitive or button variant suitable for shell and toolbar icon-only actions with accessible names and focus-visible states.
- [x] 2.3 Add shared status badge variants for connected, pending, running, warning, error, success, disabled, and neutral states.
- [x] 2.4 Add shared notice/empty/error surface primitives for consistent page feedback states.
- [x] 2.5 Add shared metric tile, metadata row, and status-list primitives that handle long IDs, URLs, paths, and timestamps without overlap.
- [x] 2.6 Add reusable tokenized utilities for neon glow, subtle grid/depth surfaces, focus rings, disabled treatment, and reduced-motion-safe transitions.
- [x] 2.7 Add or update `@cthutool/ui` type/import tests for the new primitives and token stylesheet entrypoint.

## 3. Shared App-Shell Composition

- [x] 3.1 Add a host-neutral page frame component with eyebrow/title/description, toolbar slot, content slot, and stable scroll behavior.
- [x] 3.2 Add safe atmospheric layer hooks or slots for decorative grid, glow, and 3D-inspired depth effects that sit behind readable content.
- [x] 3.3 Add host-neutral page toolbar, status/notice composition, metric summary, metadata list, and status-list exports where they belong in `@cthutool/app-shell`.
- [x] 3.4 Ensure app-shell components do not import Electron, preload modules, desktop renderer APIs, or browser-only globals.
- [x] 3.5 Add capability-aware fallback behavior for host-only controls rendered through shared shell/page composition.
- [x] 3.6 Add package-level type tests that exercise desktop-capable and web-safe runtime adapters with the new app-shell components.

## 4. Desktop Shell Refresh

- [x] 4.1 Extract desktop titlebar, activity bar, settings entry, subnav, and statusbar rendering from `App.tsx` into focused renderer modules.
- [x] 4.2 Remove, disable, or replace incomplete appearance/theme configuration controls that conflict with the fixed tokenized visual-system pass.
- [x] 4.3 Apply the refreshed shell chrome styles for titlebar identity, combined statusbar connection-info entry, activity buttons, badges, Settings entry, subnav, window buttons, and statusbar segments.
- [x] 4.4 Add restrained retro-futuristic atmosphere through tokenized dark surfaces, neon accents, subtle grid/depth effects, and reduced-motion-safe transitions.
- [x] 4.5 Make the bottom statusbar connection-info entry the only global connection summary and route activation to the Settings status detail surface.
- [x] 4.6 Remove duplicate connection-status labels from the titlebar and Overview while preserving environment/backend context and useful operational metrics.
- [x] 4.7 Consolidate Local Status and Diagnostics connection/runtime details into one Settings status detail surface without losing backend URL, agent id, last registration, last error, runtime diagnostic, platform, version, or local path information.
- [x] 4.8 Preserve Electron frameless drag regions and route minimize, maximize, and close through the existing desktop runtime adapter.
- [x] 4.9 Keep active, hover, disabled, focus-visible, and badge states stable across shell controls.
- [x] 4.10 Update renderer tests to cover shell navigation, Settings separation, single connection-status summary behavior, statusbar clicks, window action calls, and appearance-control removal/replacement after extraction.

## 5. Desktop Icon Assets

- [x] 5.1 Derive CthuDesktop icon concept artwork from the existing CthuTool/CthuCodex base style rather than generating an unrelated new mark; preserve wordmark construction, backplate silhouette, central port placement, bevel/glow treatment, and circuit-detail density.
- [x] 5.2 Change only the product wording to `CthuDesktop` and apply a restrained desktop-specific accent palette unless a later approved design explicitly changes the shared logo system.
- [x] 5.3 Produce a square transparent package icon composition from the accepted CthuDesktop same-family logo, preserving the horizontal logo inside the square without a decorative outer frame, border, or opaque background plate.
- [x] 5.4 Produce package-ready, taskbar/window-ready, and renderer-ready assets for `apps/desktop/build/icon.png` and `apps/desktop/build/icon.svg` after the final direction is accepted, with renderer titlebar and startup loading chrome reusing the canonical build PNG rather than a second copied asset.
- [x] 5.5 Verify small-size variants remain related to the primary horizontal structure even when cropped or simplified.
- [x] 5.6 Update package/icon tests or asset checks if file names or formats change.

## 6. Desktop Window Sizing

- [x] 6.1 Add a main-process window-bounds helper that derives first-launch default size from the current display work area with min/max constraints.
- [x] 6.2 Restore persisted user window size and position on later launches, including maximized state, when saved bounds are valid.
- [x] 6.3 Detect saved bounds that are outside all available display work areas and recover by opening a valid visible window while preserving size when possible.
- [x] 6.4 Keep the existing persisted `windowState` config shape unless a later change explicitly introduces a migration.
- [x] 6.5 Add or update unit coverage for first-launch adaptive sizing, persisted bounds normalization, maximized restore, and off-screen recovery.

## 7. Desktop Page Frame Adoption

- [x] 7.1 Replace desktop `WorkspacePanel` usage with the shared page frame for Overview, Tasks, Browser Profiles, Agents, and Settings sections.
- [x] 7.2 Move common toolbar, refresh, save, error, empty, status-list, metadata, and metric rendering to shared UI/app-shell primitives where host-neutral.
- [x] 7.3 Keep Task Center, Browser Profiles, Agents, and Settings business content behavior unchanged except for layout/frame integration.
- [x] 7.4 Ensure long URLs, agent IDs, paths, profile names, and timestamps wrap or truncate predictably across all migrated pages.
- [x] 7.5 Reduce `App.tsx` and `styles.css` by moving page-specific renderer code and styles into focused modules without introducing unrelated refactors.

## 8. Styling Organization

- [x] 8.1 Reorganize renderer CSS into clear token, shell, page-frame, and page-specific sections or files consistent with the existing build.
- [x] 8.2 Remove duplicated desktop-local styles that are replaced by shared primitives.
- [x] 8.3 Remove or simplify old Dracula/theme-switching CSS paths that are no longer used by the active tokenized visual system.
- [x] 8.4 Verify the app does not use nested-card visual treatment for page sections or repeated list items introduced by the refresh.
- [x] 8.5 Check future theme replacement remains possible through token mappings even though only the dark neon theme is polished in this pass.

## 9. Verification

- [x] 9.1 Run `pnpm --filter @cthutool/ui test`.
- [x] 9.2 Run `pnpm --filter @cthutool/app-shell test`.
- [x] 9.3 Run `pnpm --filter @cthutool/desktop test`.
- [x] 9.4 Run `pnpm --filter @cthutool/desktop typecheck`.
- [x] 9.5 Run `openspec validate apps-desktop-shell-visual-system --strict`.
- [x] 9.6 Run `git diff --check`.
- [x] 9.7 Perform a visual smoke check of the desktop shell and core page frames at desktop-sized and narrow renderer widths, verifying no obvious overlap, blank surfaces, unreadable neon contrast, excessive glow, or unusable controls.
- [x] 9.8 Verify reduced-motion handling for any decorative grid, glow, depth, or transition effects introduced by the refresh.
- [x] 9.9 Verify first launch, restored launch, maximized launch, and off-screen recovery behavior manually or through focused main-process tests.
- [x] 9.10 Verify desktop icon assets render cleanly in package resources, Electron main-process window/taskbar configuration, renderer titlebar/startup loading chrome, and small-size previews.
