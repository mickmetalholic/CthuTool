## Context

App shell and UI are shared by desktop and web surfaces. They already have typecheck coverage and basic runtime tests, but they need behavior tests that assert navigation, runtime contracts, and component interactions rather than only importability.

## Goals / Non-Goals

**Goals:**

- Add tests for app-shell navigation and runtime contract behavior.
- Add tests for UI component rendering, events, disabled states, composition, and class merging.
- Keep type-only public API contracts in `typecheck`.
- Record coverage baselines and evaluate threshold readiness separately for each package.

**Non-Goals:**

- Do not introduce a visual regression test system.
- Do not create a component documentation site.
- Do not force both packages to share the same threshold decision.

## Decisions

### Test shared behavior through public exports

Tests should import from package public surfaces unless a source-level utility has no exported contract. This keeps package consumers represented.

Alternative considered: testing every internal file directly. That could inflate coverage while weakening confidence in public behavior.

### Keep app-shell and UI in one change

The packages are tightly related and app-shell consumes UI. A single change can coordinate baselines and avoid duplicated setup.

Alternative considered: separate changes. That is cleaner by package, but would likely duplicate testing infrastructure and review context.

## Risks / Trade-offs

- Component tests become implementation-specific -> Prefer user-observable roles, text, events, and state.
- App-shell coverage depends on UI build output -> Use existing Vitest aliases or package builds consistently with current test governance.
