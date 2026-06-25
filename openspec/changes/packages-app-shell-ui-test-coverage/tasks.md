## 1. Baseline

- [ ] 1.1 Run `pnpm --filter @cthutool/app-shell test:cov` and record current coverage.
- [ ] 1.2 Run `pnpm --filter @cthutool/ui test:cov` and record current coverage.
- [ ] 1.3 Inventory shared package source files with meaningful uncovered behavior.

## 2. App Shell Tests

- [ ] 2.1 Add tests for navigation ids, ordering, labels, and route metadata.
- [ ] 2.2 Add tests for web runtime behavior through public exports.
- [ ] 2.3 Add tests for desktop runtime behavior through public exports.
- [ ] 2.4 Confirm type-only contracts continue to run through `typecheck`.

## 3. UI Tests

- [ ] 3.1 Add component tests for shared button or primitive components.
- [ ] 3.2 Add tests for event handling and disabled state behavior.
- [ ] 3.3 Add tests for class composition and variant behavior.
- [ ] 3.4 Keep utility tests for `cn` and add edge cases if needed.

## 4. Coverage Policy

- [ ] 4.1 Re-run app-shell and UI coverage and record new baselines.
- [ ] 4.2 Decide separately whether app-shell and UI remain visibility-only or become threshold-gated.
- [ ] 4.3 Update coverage policy documentation and contract tests for any gating decision.

## 5. Verification

- [ ] 5.1 Run `pnpm --filter @cthutool/app-shell typecheck`.
- [ ] 5.2 Run `pnpm --filter @cthutool/ui typecheck`.
- [ ] 5.3 Run `pnpm --filter @cthutool/app-shell test:cov`.
- [ ] 5.4 Run `pnpm --filter @cthutool/ui test:cov`.
- [ ] 5.5 Run affected root contract tests.
- [ ] 5.6 Run `openspec status --change packages-app-shell-ui-test-coverage` and confirm the change is apply-ready.
