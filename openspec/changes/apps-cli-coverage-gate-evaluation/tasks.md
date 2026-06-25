## 1. Baseline

- [ ] 1.1 Run `pnpm --filter @cthutool/cli test:cov` and capture the Bun coverage output.
- [ ] 1.2 Record CLI coverage metrics and identify which metrics Bun reports reliably.
- [ ] 1.3 Compare CLI coverage artifacts with the root coverage artifact contract.

## 2. Coverage Path Classification

- [ ] 2.1 Identify package-owned CLI source files included in coverage.
- [ ] 2.2 Identify bundled script files included in coverage and decide whether they are package-owned coverage.
- [ ] 2.3 Identify temporary execution paths or external plugin scripts and decide whether they should be excluded.
- [ ] 2.4 Add narrow coverage excludes only for generated, temporary, or non-package-owned paths.

## 3. Gate Evaluation

- [ ] 3.1 Determine whether Bun coverage supports a useful package-local threshold gate.
- [ ] 3.2 If CLI graduates, add Bun-compatible coverage gate configuration or documented enforcement.
- [ ] 3.3 If CLI remains visibility-only, document the blockers and next test coverage priorities.
- [ ] 3.4 Update root contract tests to preserve the CLI Bun runner and gate decision.

## 4. Verification

- [ ] 4.1 Run `pnpm --filter @cthutool/cli typecheck`.
- [ ] 4.2 Run `pnpm --filter @cthutool/cli test`.
- [ ] 4.3 Run `pnpm --filter @cthutool/cli test:cov`.
- [ ] 4.4 Run affected root contract tests.
- [ ] 4.5 Run `openspec status --change apps-cli-coverage-gate-evaluation` and confirm the change is apply-ready.
