## Context

The desktop package already has meaningful Vitest coverage, but several paths are still only partially exercised. The most important gaps are platform-sensitive persistence behavior, auth profile state transitions, Playwright host close/verify flows, and renderer interactions that coordinate backend settings, agents, tasks, and browser actions.

Desktop remains visibility-only in the coverage policy. This change should improve behavioral confidence first, then use the resulting baseline to decide whether a later threshold gate is appropriate.

## Goals / Non-Goals

**Goals:**

- Add focused tests for desktop main-process stores and Playwright host behavior.
- Expand renderer workflow tests where they validate real user flows.
- Preserve the existing desktop runner and package-local coverage artifact contract.
- Capture a post-change baseline for statements, branches, functions, and lines.

**Non-Goals:**

- Do not introduce new desktop features.
- Do not require a coverage threshold for desktop in this change unless the baseline clearly supports a conservative gate.
- Do not rewrite tests into end-to-end Electron UI tests.

## Decisions

### Prefer targeted unit and renderer tests over packaged-app tests

Desktop packaging is already covered by the artifact workflow. The coverage gap is in behavior, so tests should target stores, host orchestration, and renderer workflows directly.

Alternative considered: add full Electron smoke tests. That would be slower and more brittle before the lower-level coverage is complete.

### Test platform-sensitive persistence through the store API

The browser profile store should have tests that simulate or exercise replace failures and retries. This keeps Windows-specific reliability covered without requiring Windows-only test logic.

Alternative considered: only rely on GitHub Actions Windows jobs. That catches failures late and makes the root cause harder to isolate.

### Treat threshold graduation as an outcome, not an assumption

After coverage improves, record the baseline and decide whether desktop can move from visibility-only to threshold-gated. The default expectation is visibility-only unless the numbers and test quality justify promotion.

Alternative considered: set a threshold immediately. That could turn shallow coverage growth into a brittle gate.

## Risks / Trade-offs

- Tests over-mock Playwright behavior -> Keep assertions tied to observable host commands, profile states, and pending task outcomes.
- Renderer tests become slow -> Focus on user-visible workflows and avoid duplicating component internals.
- Desktop baseline remains too low for gating -> Keep visibility-only status and document the next uncovered areas.
