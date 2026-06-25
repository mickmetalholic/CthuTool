## 1. Baseline

- [ ] 1.1 Run `pnpm --filter @cthutool/web test:cov` and record current coverage.
- [ ] 1.2 Run `pnpm --filter @cthutool/docs test:cov` and record current coverage.
- [ ] 1.3 Inventory uncovered web and docs behavior that can be tested without browser e2e.

## 2. Web Tests

- [ ] 2.1 Add web utility tests for normal, empty, and conflicting inputs.
- [ ] 2.2 Add project shell rendering or behavior tests with user-observable assertions.
- [ ] 2.3 Add tests for app-owned configuration or route metadata if applicable.

## 3. Docs Tests

- [ ] 3.1 Expand docs content tests for required frontmatter and route discoverability.
- [ ] 3.2 Add internal link or reference validation where content structure supports it.
- [ ] 3.3 Confirm generated output directories remain excluded from docs validation and tests.

## 4. Coverage Policy

- [ ] 4.1 Re-run web and docs coverage and record new baselines.
- [ ] 4.2 Decide separately whether web and docs remain visibility-only or become threshold-gated.
- [ ] 4.3 Update coverage policy documentation and contract tests for any gating decision.

## 5. Verification

- [ ] 5.1 Run `pnpm --filter @cthutool/web typecheck`.
- [ ] 5.2 Run `pnpm --filter @cthutool/docs typecheck`.
- [ ] 5.3 Run `pnpm --filter @cthutool/web test:cov`.
- [ ] 5.4 Run `pnpm --filter @cthutool/docs test:cov`.
- [ ] 5.5 Run affected root contract tests.
- [ ] 5.6 Run `openspec status --change apps-web-docs-test-coverage` and confirm the change is apply-ready.
