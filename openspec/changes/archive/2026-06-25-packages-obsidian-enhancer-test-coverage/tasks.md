## 1. Baseline

- [x] 1.1 Run `pnpm --filter @cthutool/obsidian-enhancer test:cov` and record current coverage.
- [x] 1.2 Inventory uncovered source files and classify them as domain, adapter, or integration-only.

## 2. Test Expansion

- [x] 2.1 Add tests for tag parsing, normalization, duplicates, and invalid values.
- [x] 2.2 Add tests for excluded root matching and path edge cases.
- [x] 2.3 Add tests for Obsidian-facing adapter boundaries using typed fakes.
- [x] 2.4 Add negative tests for malformed or unsupported inputs.

## 3. Coverage Policy

- [x] 3.1 Re-run package coverage and record the new baseline.
- [x] 3.2 Decide whether to promote `@cthutool/obsidian-enhancer` to threshold-gated coverage.
- [x] 3.3 If promoted, add conservative package-local thresholds and update root coverage contract tests.
- [x] 3.4 Not applicable because `@cthutool/obsidian-enhancer` was promoted to threshold-gated coverage.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @cthutool/obsidian-enhancer typecheck`.
- [x] 4.2 Run `pnpm --filter @cthutool/obsidian-enhancer test`.
- [x] 4.3 Run `pnpm --filter @cthutool/obsidian-enhancer test:cov`.
- [x] 4.4 Run affected root contract tests.
- [x] 4.5 Run `openspec status --change packages-obsidian-enhancer-test-coverage` and confirm the change is apply-ready.
