## 1. Coverage Inventory

- [ ] 1.1 Run `pnpm --filter @cthutool/desktop test:cov` and record the current desktop coverage baseline.
- [ ] 1.2 Identify uncovered desktop main-process files and renderer workflows with meaningful behavior.
- [ ] 1.3 Confirm desktop remains outside `scratches/collection-hub` and root-only governance boundaries.

## 2. Main Process Tests

- [ ] 2.1 Add BrowserProfileStore tests for metadata save, update, list, clear, and invalid metadata handling.
- [ ] 2.2 Add BrowserProfileStore tests for retryable metadata replacement failures.
- [ ] 2.3 Add PendingAuthTaskStore tests for upsert, resolution, replacement, and stale task behavior.
- [ ] 2.4 Expand PlaywrightHost tests for verified, login-required, blocked, and close-triggered verification flows.

## 3. Renderer Workflow Tests

- [ ] 3.1 Expand renderer tests for backend settings edits and persistence boundaries.
- [ ] 3.2 Expand renderer tests for agent status and task workflow transitions.
- [ ] 3.3 Add tests for browser action workflows that surface pending auth or runtime errors.

## 4. Coverage Policy

- [ ] 4.1 Re-run desktop coverage and record the new baseline.
- [ ] 4.2 Update coverage policy documentation with the desktop baseline and gating decision.
- [ ] 4.3 If desktop graduates to threshold-gated coverage, add conservative package-local thresholds and contract coverage.

## 5. Verification

- [ ] 5.1 Run `pnpm --filter @cthutool/desktop typecheck`.
- [ ] 5.2 Run `pnpm --filter @cthutool/desktop test`.
- [ ] 5.3 Run `pnpm --filter @cthutool/desktop test:cov`.
- [ ] 5.4 Run root contract tests affected by coverage policy changes.
- [ ] 5.5 Run `openspec status --change apps-desktop-test-coverage` and confirm the change is apply-ready.
