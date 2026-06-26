## Context

Web and docs have different runtime models but both are frontend/content packages with shallow current coverage. The goal is to increase useful validation without turning the change into browser automation or visual regression work.

## Goals / Non-Goals

**Goals:**

- Add web tests for utilities, shell rendering, and user-observable behavior.
- Add docs tests for content metadata, route discoverability, and link integrity where feasible.
- Preserve generated-output exclusions for `.astro`, `dist`, and `coverage`.
- Record coverage baselines and make explicit gating decisions.

**Non-Goals:**

- Do not add Playwright browser e2e tests.
- Do not require pixel or screenshot testing.
- Do not redesign web or docs pages.

## Decisions

### Keep tests fast and package-local

Use Vitest and framework-compatible helpers to test behavior without running production servers. This keeps root validation fast.

Alternative considered: add full browser e2e coverage. That should be a separate change if needed.

### Treat docs as content behavior, not just build output

Docs tests should validate content metadata and internal structure directly. Build success alone is not enough to catch missing descriptions, bad links, or undiscoverable pages.

Alternative considered: only rely on `astro check`. That catches type diagnostics but not content quality regressions.

## Risks / Trade-offs

- Content tests become too strict -> Start with stable metadata and link rules, not editorial style.
- Web tests duplicate framework behavior -> Focus on local utilities and app-owned rendering decisions.
