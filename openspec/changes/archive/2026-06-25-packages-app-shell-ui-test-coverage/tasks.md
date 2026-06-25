## 1. Baseline

- [x] 1.1 Run `pnpm --filter @cthutool/app-shell test:cov` and record current coverage.
- [x] 1.2 Run `pnpm --filter @cthutool/ui test:cov` and record current coverage.
- [x] 1.3 Inventory shared package source files with meaningful uncovered behavior.

## 2. App Shell Tests

- [x] 2.1 Add tests for navigation ids, ordering, labels, and route metadata.
- [x] 2.2 Add tests for web runtime behavior through public exports.
- [x] 2.3 Add tests for desktop runtime behavior through public exports.
- [x] 2.4 Confirm type-only contracts continue to run through `typecheck`.

## 3. UI Tests

- [x] 3.1 Add component tests for shared button or primitive components.
- [x] 3.2 Add tests for event handling and disabled state behavior.
- [x] 3.3 Add tests for class composition and variant behavior.
- [x] 3.4 Keep utility tests for `cn` and add edge cases if needed.

## 4. Coverage Policy

- [x] 4.1 Re-run app-shell and UI coverage and record new baselines.
- [x] 4.2 Decide separately whether app-shell and UI remain visibility-only or become threshold-gated.
- [x] 4.3 Update coverage policy documentation and contract tests for any gating decision.

## 5. Verification

- [x] 5.1 Run `pnpm --filter @cthutool/app-shell typecheck`.
- [x] 5.2 Run `pnpm --filter @cthutool/ui typecheck`.
- [x] 5.3 Run `pnpm --filter @cthutool/app-shell test:cov`.
- [x] 5.4 Run `pnpm --filter @cthutool/ui test:cov`.
- [x] 5.5 Run affected root contract tests.
- [x] 5.6 Run `openspec status --change packages-app-shell-ui-test-coverage` and confirm the change is apply-ready.
