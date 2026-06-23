## Context

Browser Host is now the primary workspace for host browser capability management. The current renderer already loads backend browser status, local pending-auth state, runtime diagnostics, and explicit profile actions, but the page still mixes summary and profile rows without a strong operational structure.

This change is a renderer-focused refinement. It should improve how existing browser state is organized and acted on, while leaving backend browser APIs, preload IPC contracts, profile storage, automation behavior, and the separate future logging system untouched.

## Goals / Non-Goals

**Goals:**

- Make Browser Host scannable as a management page for the current host browser runtime.
- Separate runtime readiness, browser-auth attention, managed profiles, and action feedback into predictable page sections.
- Associate login, verify, and clear feedback with the affected site/profile row where possible.
- Preserve local pending-auth fallback when backend browser status is unavailable.
- Update renderer tests to lock in navigation, state presentation, action behavior, and failure recovery.

**Non-Goals:**

- No new backend endpoints, WebSocket messages, or browser automation commands.
- No log viewer, log stream, log storage, or log IPC work.
- No generic Tasks workspace reintroduction.
- No redesign of Settings or Home beyond preserving their links into Browser Host.
- No change to persisted browser profile data or authentication verification logic.

## Decisions

1. Keep Browser Host as a renderer composition over existing data sources.

   The page will derive display state from `BrowserStatus`, local pending-auth tasks, `DesktopAppInfo.browserRuntime`, and existing action state. This keeps the change low risk and avoids coupling UI refinement to backend or main-process changes.

2. Introduce a page-level structure before adding new controls.

   Browser Host should present runtime readiness first, then browser-auth attention, then managed profiles. This ordering matches the operational workflow: confirm host capability, resolve blockers, inspect profile state.

3. Scope action feedback to the affected site/profile.

   Existing browser actions already take a site/profile target. The renderer can track the active action target and show loading/success/error feedback next to the relevant row, while retaining a page-level fallback for unexpected errors.

4. Preserve explicit user actions.

   Browser Host may highlight attention, but it must not automatically open login windows, verify profiles, or clear profiles. Every browser-affecting operation remains button-driven.

5. Keep the existing visual system and shared primitives.

   This change should refine layout density, grouping, empty states, and row affordances using current desktop styles and available shared UI components. It should not introduce a new visual direction or dependency.

## Risks / Trade-offs

- Per-row feedback may add state complexity in `App.tsx` -> keep the action state model small and keyed by site/profile/action.
- Local and backend pending-auth data may duplicate the same attention -> continue using the existing merge/dedupe behavior when presenting attention.
- More page sections can become noisy on small windows -> use responsive grids and stable row dimensions, and cover mobile/narrow renderer behavior in CSS review.
- Leaving logs out of scope means diagnostics remain runtime/status only -> keep copy explicit and do not imply log visibility exists.
