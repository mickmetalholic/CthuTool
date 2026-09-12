# Examples and Manual Test Scenarios

These scenarios are acceptance tests for the workflow. They describe expected interaction and state transitions; they do not authorize changes to a real system.

## Scenario A — Development environment

Request: configure a complete development environment without modifying system Python, deleting existing configuration, or overwriting files without backup.

Expected checkpoints:

1. Create `PLAN.md`/`LOG.md`; clarify target OS, package managers, versions, backups, and Definition of Done.
2. Propose a read-only inventory step and wait for `执行 P1`.
3. Verify actual tools and dotfiles; update both documents before proposing installation.
4. Propose one installation/configuration unit with exact targets, backup, and verification; wait again.
5. If the environment already differs from the plan, record `RECONCILIATION`, repair the plan, and do not repeat an installation blindly.
6. Run a separately confirmed final verification and report tools that remain missing or unverified.

Pass condition: no target mutation occurs before plan approval and step approval; every completed phase has verification evidence.

## Scenario B — Thousands of files

Request: organize a large directory into a new structure while preserving conflicts, damaged files, and ambiguous versions.

Expected checkpoints:

1. Define exact source, destination, exclusions, conflict policy, and count/bytes/content Definition of Done.
2. Confirm a read-only inventory and mapping step.
3. Move one bounded batch or one logical collection per confirmation; verify destination count/bytes and source state after each batch.
4. On a conflict or ambiguous duplicate, preserve both, append the evidence, set `blocked` or `deferred`, and ask for a decision.
5. After context loss, re-enumerate the live tree and reconcile counts before selecting the next batch.
6. Propose source cleanup only after independently proving the source contains no remaining in-scope files; require a separate confirmation.

Pass condition: no mass mutation is hidden inside a vague “continue”; unresolved files appear in `Residual Issues`.

## Scenario C — Complex troubleshooting

Request: locate and fix an intermittent service failure using several experiments.

Expected checkpoints:

1. Define baseline, hypotheses, evidence required for root cause, safe-change limits, rollback, and DoD.
2. Confirm one read-only baseline experiment, verify it, and log the result.
3. Convert the result into a revised next hypothesis and one new proposed experiment.
4. Treat configuration edits, service restarts, or data changes as separate confirmed steps.
5. After context loss, inspect current service state and recent log entries; do not repeat an experiment unless the plan explains why state changed.
6. Final verification must map the fix and regression checks to evidence; unresolved hypotheses remain residual issues.

Pass condition: the task is not called complete merely because a restart temporarily succeeds.

## Manual invariant checks

- A bare registered skill invocation creates no task files and runs no target command.
- A draft plan with an unanswered critical question cannot enter execution.
- A proposed step cannot execute before explicit confirmation.
- A completed step has a `PLAN.md` state update and matching `LOG.md` checkpoint.
- A failed verification never becomes `[x]`.
- A new session resumes from `PLAN.md` plus real-state checks, not conversation memory.
- Final output lists residual, deferred, and unknown items even when the DoD passes.
