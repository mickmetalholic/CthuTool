## 1. Tracked Git Hook Infrastructure

- [ ] 1.1 Add a dependency-free repository hook installer that configures `core.hooksPath=.githooks`, handles repeated runs, non-Git directories, CI, and an explicit disable switch; verify focused installer tests cover each result.
- [ ] 1.2 Move the existing pre-commit and commit-message command bodies into tracked `.githooks` entrypoints; update the current hook contract tests and verify both validation chains remain exact.
- [ ] 1.3 Update the root package lifecycle and lockfile to run the repository hook installer, expose a manual repair command, and remove the obsolete Husky dependency and tracked entrypoints; verify a lifecycle-suppressed lockfile install succeeds and package contract tests pass.

## 2. Tool-Neutral AI Tooling Bootstrap

- [ ] 2.1 Add a shared check-then-repair bootstrap entrypoint that distinguishes valid state, repairable generated-state drift, and prerequisite/setup failures; verify focused tests cover no-op, repair, failure diagnostics, and protected-plugin non-mutation.
- [ ] 2.2 Add a tracked `post-checkout` hook that skips file checkouts and invokes the shared bootstrap for branch/worktree checkouts; verify a temporary Git fixture proves standard `git worktree add` runs bootstrap without per-worktree dependency installation.
- [ ] 2.3 Invoke the shared bootstrap for the current checkout from hook installation when prerequisites are available and preserve actionable failure behavior; verify installer tests cover fresh-checkout repair and missing-prerequisite output.

## 3. Documentation and Policy

- [ ] 3.1 Update `docs/ai-tooling.md`, `.codex/README.md`, and applicable root agent guidance to document automatic clone/worktree behavior, the OpenSpec prerequisite, `--ignore-scripts` and `--no-checkout` exceptions, and manual recovery commands; verify documented commands match package scripts and hook behavior.
- [ ] 3.2 Add or update root engineering contract tests for the tracked hook path, package lifecycle, ignored generated adapters, and protected business-plugin boundary; verify the focused contract suite passes.

## 4. Validation

- [ ] 4.1 Run targeted formatting/linting and TypeScript checks for changed scripts and tests, then run `git diff --check`; verify all commands pass without starting or building application services.
- [ ] 4.2 Run the AI tooling read-only check followed by two setup runs, verify the second run is idempotent, and confirm `codex/plugins/cthu-codex` remains unchanged.
- [ ] 4.3 Run strict validation for `apps-root-automate-ai-tooling-worktree-bootstrap` and verify every task-required artifact remains complete.
