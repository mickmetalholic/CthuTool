## Context

CLI remains on Bun test because that runner validates the runtime used by the package. It has many tests, but Bun coverage output and Codecov aggregation differ from Vitest packages. Some paths may represent bundled scripts or temporary execution files that should not influence a CLI quality gate.

## Goals / Non-Goals

**Goals:**

- Record a CLI Bun coverage baseline.
- Classify included and excluded coverage paths.
- Decide whether CLI can use a Bun-native threshold gate.
- Keep CLI runner fidelity.

**Non-Goals:**

- Do not migrate CLI tests to Vitest.
- Do not rewrite the CLI test suite broadly.
- Do not introduce thresholds until coverage inputs are understood.

## Decisions

### Evaluate coverage inputs before thresholds

CLI coverage should first be made understandable. A gate is useful only if the included files represent package-owned behavior and stable execution paths.

Alternative considered: set a low threshold immediately. That could hide path-quality problems and make the gate meaningless.

### Keep Bun as the source of truth

Any CLI gate should work with Bun coverage output rather than requiring Vitest-specific summaries.

Alternative considered: run CLI under both Bun and Vitest. That would duplicate runner behavior and reduce confidence in runtime-specific tests.

## Risks / Trade-offs

- Bun coverage lacks the same threshold controls as Vitest -> Use documented Bun-native options or keep CLI visibility-only.
- External script paths pollute coverage -> Add precise excludes only for non-package-owned or generated paths.
- Baseline is lower than expected -> Record gaps and prioritize behavior tests before gating.
