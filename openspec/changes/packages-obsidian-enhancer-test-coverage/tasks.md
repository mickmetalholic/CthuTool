## 1. Baseline

- [ ] 1.1 Run `pnpm --filter @cthutool/obsidian-enhancer test:cov` and record current coverage.
- [ ] 1.2 Inventory uncovered source files and classify them as domain, adapter, or integration-only.

## 2. Test Expansion

- [ ] 2.1 Add tests for tag parsing, normalization, duplicates, and invalid values.
- [ ] 2.2 Add tests for excluded root matching and path edge cases.
- [ ] 2.3 Add tests for Obsidian-facing adapter boundaries using typed fakes.
- [ ] 2.4 Add negative tests for malformed or unsupported inputs.

## 3. Coverage Policy

- [ ] 3.1 Re-run package coverage and record the new baseline.
- [ ] 3.2 Decide whether to promote `@cthutool/obsidian-enhancer` to threshold-gated coverage.
- [ ] 3.3 If promoted, add conservative package-local thresholds and update root coverage contract tests.
- [ ] 3.4 If not promoted, document remaining gaps in the coverage policy.

## 4. Verification

- [ ] 4.1 Run `pnpm --filter @cthutool/obsidian-enhancer typecheck`.
- [ ] 4.2 Run `pnpm --filter @cthutool/obsidian-enhancer test`.
- [ ] 4.3 Run `pnpm --filter @cthutool/obsidian-enhancer test:cov`.
- [ ] 4.4 Run affected root contract tests.
- [ ] 4.5 Run `openspec status --change packages-obsidian-enhancer-test-coverage` and confirm the change is apply-ready.
