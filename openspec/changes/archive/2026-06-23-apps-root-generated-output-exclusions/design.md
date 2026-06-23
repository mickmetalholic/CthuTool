## Context

Root-managed validation now runs lint, typecheck, tests, and coverage across `apps/*` and `packages/*`. Coverage artifacts are generated more often than before, and at least one validation path can see generated coverage files after a coverage run. For example, `apps/docs` currently includes `**/*` in its TypeScript project and excludes only `dist`, so generated coverage assets can appear in `astro check` diagnostics.

Biome already excludes common generated directories at the root, but generated-output policy is not consistently expressed across TypeScript, Astro, Vitest, and root engineering contracts. The change should make generated artifacts available for CI upload and caching while preventing them from being treated as source input.

Generated agent adapter folders under `.claude/`, `.codex/`, and `.cursor/` are also generated outputs, but they are intentionally shared project assets when committed. This change should not hand-edit those adapters or redefine their generation policy.

## Goals / Non-Goals

**Goals:**

- Make root-managed validation deterministic regardless of whether `coverage`, `dist`, `out`, `.next`, `.astro`, or package release outputs exist locally.
- Exclude generated outputs from lint, typecheck, docs checks, and test discovery without hiding source files.
- Keep coverage artifacts eligible for Turbo caching, CI artifact upload, and Codecov consumption.
- Add root engineering contracts that catch generated-output exclusion regressions.
- Preserve the root workspace boundary excluding `scratches/collection-hub`.

**Non-Goals:**

- Do not change coverage artifact paths or coverage quality thresholds.
- Do not change runtime behavior or test assertions.
- Do not clean up historical generated files beyond what is needed to validate the exclusion policy.
- Do not hand-edit generated agent adapter instructions under `.claude/`, `.codex/`, or `.cursor/`.
- Do not change `scratches/collection-hub`.

## Decisions

### Use tool-native exclusions instead of one broad workaround

Each validation tool should ignore generated outputs through its normal configuration surface:

- TypeScript projects should exclude generated directories that their `include` patterns could otherwise capture.
- Astro docs checks should inherit the docs TypeScript exclusions so generated coverage assets are not diagnosed.
- Vitest configs should keep test `include` patterns narrow and coverage `include` patterns source-focused.
- Biome should continue to exclude generated directories at the root.

Alternative considered: add generated directories only to `.gitignore` or rely on developers to clean local outputs. That does not affect tools that already scan existing local files.

### Keep generated artifacts publishable

Excluding generated directories from validation must not remove them from Turbo outputs, CI upload paths, or Codecov inputs. The policy is "not source input", not "never produced".

Alternative considered: disable local coverage output for packages that cause noise. That would undo the previous coverage visibility work.

### Contract-test observable behavior

Root engineering contract tests should inspect config and, where practical, create or model generated-output paths to ensure standard validation scripts do not depend on those files. Contracts should focus on generated-output policy rather than exact formatting of every package config.

Alternative considered: rely only on full root command runs. Full runs catch current failures but do not explain the intended policy or prevent drift in new packages.

## Risks / Trade-offs

- Over-broad exclusions hide real source files -> Keep exclusions limited to generated directory names and framework output paths.
- Tool configs drift independently -> Add root contract tests for the shared generated-output set.
- Coverage artifact consumers accidentally lose files -> Verify Turbo outputs and CI coverage paths remain unchanged unless intentionally updated by a later coverage artifact contract change.
- Local generated files still appear in unrelated tools -> Include final verification after generating coverage, then running lint and typecheck.

## Migration Plan

1. Inventory root-managed validation inputs for TypeScript, Astro, Biome, and Vitest.
2. Add or normalize generated-output exclusions in package configs where validation can scan generated files.
3. Add root engineering contract tests for generated-output exclusion policy.
4. Run coverage generation for a representative package or root command, then verify lint and typecheck do not report generated-output diagnostics.
5. Run root lint, typecheck, and tests.

## Open Questions

- Should the generated-output set include additional package manager or framework caches beyond `coverage`, `dist`, `out`, `.next`, `.astro`, `release`, and `build`?
- Should root contract tests require every package `tsconfig` to exclude generated outputs, or only packages whose `include` patterns can capture them?
