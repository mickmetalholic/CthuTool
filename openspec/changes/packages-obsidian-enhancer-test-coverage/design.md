## Context

The Obsidian enhancer package currently has lightweight tests around tags and excluded roots. Because the package has limited surface area, it is a good candidate for building a complete behavior-focused test suite and validating the graduation path from visibility-only to threshold-gated coverage.

## Goals / Non-Goals

**Goals:**

- Cover core domain utilities and edge cases.
- Cover adapter boundaries without requiring a live Obsidian runtime.
- Record baseline coverage after test expansion.
- Decide whether to add conservative thresholds for the package.

**Non-Goals:**

- Do not launch Obsidian or require plugin installation in tests.
- Do not add broad UI or filesystem integration tests unless the package already exposes a stable boundary for them.
- Do not change package behavior unless tests reveal a clear bug.

## Decisions

### Use unit tests around domain and adapter seams

The package should favor fast Vitest tests that exercise pure functions and adapter-facing contracts. Obsidian APIs should be represented by typed fakes.

Alternative considered: run tests inside Obsidian. That would add tooling cost before the package needs full integration coverage.

### Promote to gated coverage only after baseline review

If the expanded suite yields a stable high baseline, this change may add package-local thresholds. If gaps remain meaningful, the package stays visibility-only with documented next steps.

Alternative considered: require thresholds up front. That risks choosing arbitrary values before the real baseline is known.

## Risks / Trade-offs

- Fakes diverge from Obsidian API behavior -> Keep fakes minimal and assert only package-owned behavior.
- Package has too little source surface for stable percentages -> Use conservative thresholds or defer gating.
