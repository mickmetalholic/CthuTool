## 1. Baseline

- [x] 1.1 Run `pnpm --filter @cthutool/web test:cov` and record current coverage.
- [x] 1.2 Run `pnpm --filter @cthutool/docs test:cov` and record current coverage.
- [x] 1.3 Inventory uncovered web and docs behavior that can be tested without browser e2e.

## 2. Web Tests

- [x] 2.1 Add web utility tests for normal, empty, and conflicting inputs.
- [x] 2.2 Add project shell rendering or behavior tests with user-observable assertions.
- [x] 2.3 Add tests for app-owned configuration or route metadata if applicable.

## 3. Docs Tests

- [x] 3.1 Expand docs content tests for required frontmatter and route discoverability.
- [x] 3.2 Add internal link or reference validation where content structure supports it.
- [x] 3.3 Confirm generated output directories remain excluded from docs validation and tests.

## 4. Coverage Policy

- [x] 4.1 Re-run web and docs coverage and record new baselines.
- [x] 4.2 Decide separately whether web and docs remain visibility-only or become threshold-gated.
- [x] 4.3 Update coverage policy documentation and contract tests for any gating decision.

## 5. Verification

- [x] 5.1 Run `pnpm --filter @cthutool/web typecheck`.
- [x] 5.2 Run `pnpm --filter @cthutool/docs typecheck`.
- [x] 5.3 Run `pnpm --filter @cthutool/web test:cov`.
- [x] 5.4 Run `pnpm --filter @cthutool/docs test:cov`.
- [x] 5.5 Run affected root contract tests.
- [x] 5.6 Run `openspec status --change apps-web-docs-test-coverage` and confirm the change is apply-ready.
