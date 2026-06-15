## Context

`apps/desktop` now runs on React 19 and can consume `@cthutool/ui` plus `@cthutool/app-shell`, but the renderer still concentrates shell chrome, page rendering, data loading, and visual styling in `App.tsx` and `styles.css`. The current UI mixes old desktop-local CSS with newer shared primitives, so navigation, page headers, panels, status messages, and toolbar actions do not yet feel like one system.

This change is the first visual-system implementation pass. It focuses on the app shell and shared page frame, not on deep redesigns of Task Center, Browser Profiles, Agents, or Settings workflows. Those pages should become easier to improve after the shell and shared layout rules are stable.

The visual direction is a restrained translation of an immersive gaming platform landing page into a desktop productivity shell: dark retro-futuristic surfaces, neon purple/rose/cyan accents, subtle HUD-like geometry, scanline/grid/depth effects, and optional 3D-like layers. It should feel energetic and distinctive without turning operational screens into a marketing hero page.

There is active neighboring OpenSpec work, so implementation must stay scoped to this change and avoid modifying unrelated Douban, backend capture, or task-center proposal artifacts unless a file is directly required for shell integration.

## Goals / Non-Goals

**Goals:**

- Make the desktop shell feel cohesive: title bar, activity bar, Settings entry, subnav, status bar, badges, and window controls should share density, states, and visual language.
- Establish a retro-futuristic neon command-center art direction using extracted design tokens rather than ad hoc component colors.
- Introduce a reusable page frame with header, optional description, toolbar, content spacing, and scroll behavior.
- Add shared primitives for common interface patterns: icon button, status badge, page toolbar, empty state, error notice, metadata row, metric tile, and status list.
- Collapse repeated connection-status UI into a single bottom statusbar connection-info affordance plus a Settings detail page, while keeping the titlebar focused on product identity and window controls.
- Make desktop window launch sizing adaptive on first run, then preserve the user's last explicit size and position on later launches, including safe recovery when saved bounds are no longer visible.
- Redesign desktop icon assets from the CthuTool and CthuCodex references so the packaged app icon, Windows taskbar/window identity, and renderer shell identity match the retro-futuristic neon command-center visual system.
- Remove or simplify the current appearance/theme configuration UI for this pass if it only exposes incomplete theme switching, while preserving token mappings for future theme replacement.
- Reduce `App.tsx` and `styles.css` pressure by extracting shell/page/component modules where doing so directly supports this refresh.
- Preserve all current desktop behavior, including frameless window drag regions, window controls, settings persistence, browser profile actions, task actions, and renderer tests.

**Non-Goals:**

- Do not redesign Task Center or Browser Profiles in depth; only make them fit the shared shell/page frame.
- Do not add a future `apps/web` application.
- Do not change backend APIs, preload IPC contracts, persisted config shape, or agent/browser automation behavior.
- Do not add user-facing window layout presets or a full window-management settings page.
- Do not introduce a new design framework beyond the existing `@cthutool/ui`, `@cthutool/app-shell`, Tailwind, and local CSS setup.
- Do not implement a full light theme polish pass; keep tokens structured for future theme replacement but optimize the current dark neon experience first.
- Do not add a game showcase carousel or download CTA literally; those landing-page concepts translate into shell depth, status presentation, and optional page-level showcase/summary patterns.

## Decisions

### Treat this as a shell-system pass, not a page redesign

The implementation should first normalize the product chrome and shared page frame. Individual pages may receive small layout adjustments so they sit correctly inside the new frame, but page-specific information architecture should remain intact.

Alternative considered: redesign every page at once. That would produce a more dramatic screenshot, but it would also make regressions harder to isolate and mix shell concerns with task/browser/settings business decisions.

### Build shared primitives before replacing desktop-local patterns

Repeated pieces such as `WorkspacePanel`, metric tiles, status lists, icon buttons, error messages, empty states, and toolbar rows should move into `@cthutool/ui` or `@cthutool/app-shell` when they are host-neutral. Desktop-only wrappers can remain in `apps/desktop` for frameless titlebar behavior and preload-backed actions.

Alternative considered: keep the refresh entirely in `apps/desktop/styles.css`. That is faster, but it keeps the future web frontend from reusing the same interface language and leaves `App.tsx` as the gravity well for every new surface.

### Use restrained production-tool density

The desktop app should read as a focused operational console: compact, legible, and scan-friendly. Use 6-8px radius for controls and panels, a predictable spacing scale, clear focus states, and restrained color. The visual style can use neon purple, cyan, rose, and green accents, but strong glow/status colors should be reserved for important state, active navigation, and primary calls to action.

Alternative considered: make a more expressive dashboard-style refresh with larger hero-like sections and decorative gradients. That would fight the app's repeated-workflows shape and increase visual noise.

### Replace theme configuration with tokenized art direction for now

The current theme configuration can be removed or reduced in this pass if it creates a false promise of theme switching. Instead, define explicit design tokens such as `--cthu-bg-base`, `--cthu-bg-shell`, `--cthu-bg-panel`, `--cthu-border-subtle`, `--cthu-neon-primary`, `--cthu-neon-accent`, `--cthu-glow-primary`, `--cthu-text-primary`, and semantic status tokens. Future themes can replace token mappings without touching shell/page component code.

Alternative considered: keep the existing appearance controls and wire the new style through them immediately. That adds interaction and persistence work before the visual system is stable.

### Treat CthuDesktop as a same-family logo variant

The CthuDesktop brand artwork should be derived from the same base logo system as `docs/assets/cthutool-logo.png` and `codex/plugins/cthu-codex/assets/icon.png`, not loosely inspired by it. The invariant base style is: horizontal glossy neon wordmark, dark rounded backplate, central vertical port/keyhole motif, cyan glow around the Cthu half, and a right-side extension area for the product suffix. The desktop variant should only change the product wording to `CthuDesktop` and apply a restrained desktop-specific accent palette. Letter construction, bevel depth, glow behavior, backplate silhouette, central motif placement, and circuit-detail density should remain visibly same-family with the two existing assets. The accepted package icon composition should be square with transparent background and no decorative outer frame or border. The Electron main process should also use the same icon asset for the runtime window/taskbar identity, because renderer-only images do not control OS taskbar icons. The renderer titlebar icon and startup loading icon should import `apps/desktop/build/icon.png` directly rather than maintaining a second renderer-local copy.

For implementation, use the existing logo assets as template references or edit targets before accepting any generated concept. A generated-from-scratch image is not acceptable unless it preserves the base style closely enough that CthuTool, CthuCodex, and CthuDesktop read as siblings from one identity system. The package app icon should use a square transparent composition derived from the accepted same-family CthuDesktop artwork, placing the horizontal logo inside a square icon canvas rather than changing it into a new standalone symbol. Do not add a square background plate, decorative app-icon border, or opaque backdrop. Small-size variants may later crop or simplify this same-family artwork, but renderer chrome should stay wired to the canonical build icon unless a future change introduces a deliberate generated variant pipeline.

Alternative considered: keep the existing cute abstract desktop icon and only recolor it. That would preserve continuity, but it would keep the desktop app visually separate from the stronger CthuTool/CthuCodex brand language and the new shell direction.

### Use optional depth/3D as atmosphere, not core interaction

3D-inspired treatment should be expressed as safe layers: perspective grid backgrounds, low-opacity frame lines, glow shadows, depth gradients, or a lightweight decorative scene behind content. These effects must never obscure text, block interactions, or cause layout shifts. Any animated depth must respect `prefers-reduced-motion`.

Alternative considered: add a full Three.js shell background immediately. That could be beautiful, but it adds verification cost and GPU/performance risk before the core desktop layout is fixed.

### Keep Electron chrome behavior desktop-local

Shared shell components may define structure, labels, and states, but draggable regions and window-control actions must stay in desktop renderer code or a desktop adapter. Shared app-shell components must not import Electron, preload modules, or `window.cthutoolDesktop`.

Alternative considered: move the whole titlebar into `@cthutool/app-shell`. That risks leaking desktop-only behavior into future web use and complicates capability gating.

### Use one statusbar connection entry and one connection detail surface

The bottom statusbar should own the single global connection-info summary: a compact entry with state icon/text, environment label, and backend URL, plus a click target that opens the Settings status detail page. The titlebar should stay focused on product identity and window controls without repeating environment labels or connection state. Overview should show operational metrics such as online agents, not full backend URL or agent ID details. Settings should contain the detailed connection/runtime surface with backend URL, agent ID, last registration, last error, runtime diagnostic, and local paths.

Alternative considered: keep status in the titlebar and environment/backend context in a separate statusbar entry. That still makes users parse two adjacent sources for one connection concept and keeps the current clutter.

### Make first-launch sizing display-aware and later launches user-owned

When no saved `windowState` exists, the main process should derive a comfortable initial window size from the primary display work area, bounded by sensible minimum and maximum dimensions. Once the user resizes or moves the window, the app should fully restore the saved size and position on later launches. If saved bounds are outside the currently available display areas, the app should recover by centering a valid window on an available display rather than opening off-screen.

Alternative considered: recalculate size on every launch. That adapts to display changes, but it ignores the user's deliberate window layout and can make the desktop app feel unstable.

### Validate behavior and visual stability together

Existing renderer tests should keep covering shell navigation, settings, agents, browser actions, tasks, and stale preload fallback behavior. New tests should cover reusable shared primitives and capability-safe rendering. A manual or browser-assisted smoke pass should check layout, focus visibility, and text overflow across the main shell states.

Alternative considered: rely only on screenshots. Screenshots help catch visual regressions but do not prove the Electron host actions or settings flows still work.

## Risks / Trade-offs

- Shared primitives may become too generic too early -> Keep additions tied to patterns already present in desktop and avoid speculative components.
- Visual refresh can accidentally change behavior -> Preserve current tests and add focused tests around shell navigation and host action controls before broad edits.
- Connection-status consolidation can hide useful diagnostics -> Keep the combined statusbar connection entry as a quick route to one Settings detail surface with the full backend/runtime details.
- Window restoration can reopen off-screen after monitor changes -> Validate saved bounds against available display work areas before applying them.
- AI-generated icon text can be imperfect -> Treat generated artwork as a concept pass, then convert or refine the final asset into clean, size-appropriate source and package outputs before replacement.
- CSS churn can create hidden regressions -> Split style ownership into token, shell, page-frame, and component layers instead of one larger global rewrite.
- Tailwind utilities and existing CSS can compete -> Use shared primitives for reusable control styling and keep desktop CSS focused on layout/chrome where app-specific behavior is needed.
- Current active neighboring changes may overlap desktop files -> Inspect diffs before implementation and do not stage unrelated OpenSpec or renderer changes.
- Neon/glow styling can reduce readability -> Keep contrast gates, limit glow opacity, avoid color-only meaning, and test long text against the darkest and brightest surfaces.
- Decorative motion or depth can feel distracting -> Restrict continuous animation to loading/state feedback, respect reduced-motion, and keep transform/opacity animations within 150-300ms for micro-interactions.

## Migration Plan

1. Inventory current renderer shell/page patterns and identify shared candidates already repeated across desktop pages.
2. Define the dark neon token set and remove/reduce incomplete theme configuration surfaces that no longer apply.
3. Add missing shared UI primitives and app-shell composition components with type tests.
4. Refactor desktop shell chrome into dedicated renderer modules while preserving existing state and event wiring.
5. Generate and refine a CthuDesktop icon direction from the CthuTool/CthuCodex references, then wire final package and renderer icon assets.
6. Consolidate connection status and connection context into one bottom statusbar entry and Settings detail surface, then remove duplicate status rows from the titlebar, bottom chrome, and Overview.
7. Update desktop main-process window creation/restoration to use adaptive first-launch sizing, persisted user bounds, and off-screen recovery.
8. Apply the shared page frame across Overview, Tasks, Browser Profiles, Agents, and Settings sections with minimal business-page rewrites.
9. Reorganize CSS into clearer token, shell, page, and component layers while keeping semantic tokens aligned with `@cthutool/ui`.
10. Run focused shared package checks, desktop renderer tests, desktop typecheck, OpenSpec validation, and visual smoke checks.

Rollback can happen per layer: revert shell module extraction, then page-frame adoption, then shared primitive additions if needed. Because no backend or preload contracts change, rollback should not require data migration.

## Open Questions

- Should the final shell keep a VS Code-like activity bar density, or move slightly toward a calmer sidebar with labels? This proposal assumes icon-only activity bar for phase one.
- Should status bar URL/path values gain copy affordances in this pass? This proposal allows metadata row support but does not require copy actions unless implementation remains small.
- Should visual smoke verification use the Codex in-app browser against the Vite renderer, or an Electron smoke run? This proposal accepts either, with existing tests as the behavioral gate.
- Should the first pass include a lightweight generated/3D atmospheric background, or only tokenized CSS depth effects? This proposal prefers CSS depth first unless implementation remains low-risk.
