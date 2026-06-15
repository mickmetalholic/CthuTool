## Why

CthuDesktop now has the shared UI/runtime foundation, but the renderer still feels like a mixed old/new interface: shell chrome, navigation, page headers, status surfaces, and repeated panels use inconsistent spacing, emphasis, and interaction states. This makes the desktop app harder to scan and makes later page-by-page improvements more expensive.

This change establishes the first visual-system pass for the desktop shell before deeper Task Center, Browser Profiles, or Settings redesigns. The goal is a calmer production-tool interface with stable layout rules, accessible interaction states, and reusable shared building blocks.

## What Changes

- Refresh the desktop shell chrome with a restrained retro-futuristic neon command-center style inspired by immersive gaming platform landing pages: dark cockpit-like surfaces, vibrant neon accents, subtle grid/glow treatment, and optional 3D/depth elements that do not interfere with desktop workflows.
- Standardize page framing for all desktop workspaces: page header, optional description, toolbar slot, content layout, section spacing, and scroll behavior.
- Introduce shared UI/app-shell building blocks for common desktop patterns such as icon buttons, status badges, page toolbar, empty/error notices, metadata rows, metric tiles, and status lists.
- Replace the current theme configuration surface for this pass with a fixed token-driven visual system. Keep design tokens extracted so future themes can be swapped by changing token mappings rather than component styles.
- Normalize shell and page style tokens around semantic roles for background, shell, workspace, panel, card, border, text, accent, glow, success, warning, and destructive states.
- Redesign and wire the CthuDesktop app icon so desktop packaging, Windows taskbar/window chrome, renderer titlebar identity, and startup loading chrome all reuse the same `apps/desktop/build/icon.png` brand asset.
- Consolidate duplicated connection-status presentation into one combined bottom statusbar connection-info entry and one detailed Settings status surface, avoiding repeated state chips across titlebar, statusbar, Overview, and diagnostics.
- Improve desktop window sizing so first launch adapts to the current display, then subsequent launches fully restore the user's last window size and position with off-screen recovery protection.
- Split desktop renderer UI code into clearer shell/page/component modules without changing backend APIs, preload APIs, task behavior, browser-profile behavior, or settings persistence.
- Preserve Electron frameless window behavior, including draggable titlebar regions and functional window controls.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-desktop-product-shell`: define shell and page-frame quality requirements for the desktop visual-system refresh.
- `packages-app-shell-runtime`: add reusable host-neutral page/shell composition patterns that desktop and future web frontend pages can share.
- `packages-ui-shared-components`: add shared interaction/status primitives and token expectations needed for consistent retro-futuristic desktop shell and page rendering.

## Impact

- Affected code:
  - `apps/desktop/src/renderer/src/App.tsx`
  - `apps/desktop/src/renderer/src/styles.css`
  - `apps/desktop/src/main/index.ts`
  - `apps/desktop/src/main/config.ts`
  - `apps/desktop/build/icon.png`
  - `apps/desktop/build/icon.svg`
  - new or extracted desktop renderer modules under `apps/desktop/src/renderer/src/`
  - `packages/app-shell/src/`
  - `packages/ui/src/`
  - desktop main/config unit tests under `apps/desktop/tests/unit/`
  - desktop renderer tests under `apps/desktop/tests/renderer/`
- No backend API, Electron main-process IPC contract, preload API, or persisted config schema changes are intended. Desktop main-process window creation/restoration behavior may change while continuing to use the existing `windowState` config shape.
- Existing appearance/theme controls may be removed or reduced in this pass if they only switch the current incomplete theme configuration; token extraction should preserve a future path for replacing the visual theme.
- Desktop icon work should use `docs/assets/cthutool-logo.png` and `codex/plugins/cthu-codex/assets/icon.png` as brand references, with visible CthuDesktop wording where text is appropriate and legible.
- Verification should include shared package type checks, desktop renderer tests, desktop typecheck, OpenSpec validation, and a visual smoke pass for shell/page layout.
