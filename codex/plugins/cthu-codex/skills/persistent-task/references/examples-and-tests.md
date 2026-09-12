# Examples and Manual Test Scenarios

These scenarios are acceptance tests for the workflow. They do not authorize changes to a real system.

## Scenario A — Development environment

Request: configure a complete development environment without modifying system Python, deleting existing configuration, or overwriting files without backup.

Expected flow:

1. Create `PLAN.md`/`LOG.md`; clarify target OS, package managers, versions, backups, and Definition of Done.
2. Show the coherent plan and first phase: inventory installed tools, inspect dotfiles, and map missing components. One `继续` approves both plan and phase.
3. Run all included read-only checks, verify the inventory, and checkpoint once at the phase boundary. Report findings first, then preview the installation/configuration phase with exact targets, backup, and verification.
4. After `继续`, perform all included installations and configuration within that reviewed scope, verifying each material outcome without asking again between routine operations.
5. If an unexpected version or package conflict requires a choice, record `PHASE_BLOCKED` and ask for the choice. A clear answer permits resuming the same scope; a new target/risk requires a revised preview.
6. Include final tool and regression checks in the last approved phase, or preview a bounded final-verification phase. Report missing or unverified tools explicitly.

Pass condition: no target mutation occurs before the first phase approval; related actions run without micro-confirmation, and each completed phase has verification evidence.

## Scenario B — Thousands of files

Request: organize a large directory while preserving conflicts, damaged files, and ambiguous versions.

Expected flow:

1. Define exact source, destination, exclusions, conflict policy, and count/bytes/content Definition of Done.
2. Preview an inventory/mapping phase. After `继续`, enumerate, hash where needed, and prepare a bounded batch map; then checkpoint and report the result before previewing the move phase.
3. Preview a move phase whose exact collections and batch bounds are reviewable. After `继续`, process all included batches, verifying destination count/bytes and source state per batch without asking after each one.
4. Preserve an unexpected conflict, record partial state, and ask for the user decision. Do not use a bare `继续` to choose a canonical version.
5. After context loss, reconcile the live tree and recorded batch outcomes before any retry.
6. Preview cleanup only after independently proving no in-scope source files remain. Cleanup is a separate phase because its target/risk differs from the move phase.

Pass condition: `继续` authorizes only the previewed collection and operations; unresolved files remain in `Residual Issues`.

## Scenario C — Complex troubleshooting

Request: locate and fix an intermittent service failure using several experiments.

Expected flow:

1. Define baseline, hypotheses, evidence required for root cause, safe-change limits, rollback, and Definition of Done.
2. Preview a diagnostic phase containing several read-only experiments. After `继续`, run those experiments and verify their observations without per-experiment confirmations.
3. Report the diagnosis first, then preview a remediation phase containing exact configuration edits, restart if needed, and regression checks. These can share one approval when the full target and rollback are explicit.
4. If evidence reveals a different service or higher-risk operation, stop and preview a revised phase instead of extending the earlier approval.
5. After context loss, inspect current service state and recent logs; never blindly replay a restart or configuration change.
6. Final verification maps each fix and regression check to evidence; unresolved hypotheses remain residual issues.

Pass condition: a transient successful restart is not reported as completed remediation, and routine experiments do not cause repeated approval prompts.

## Manual invariant checks

- A bare registered Skill invocation creates no task files and runs no target command.
- A draft plan with an unanswered critical question cannot enter execution.
- The first `继续` approves only a coherent plan and fully previewed first phase; later `继续` approves only one unchanged queued phase.
- Multiple included actions in an approved phase run without separate user confirmations.
- A completed phase has a `PLAN.md` state update, matching `LOG.md` checkpoint, and observed verification evidence.
- A required failed or unknown verification never becomes `[x]`.
- A mid-phase ambiguous choice requires an explicit answer; a material scope/risk change requires a new preview.
- A phase checkpoint reports its result before summarizing the next phase and asking for `继续`.
- A new session resumes from `PLAN.md` and real-state checks, not conversation memory or blind replay.
- Final output lists residual, deferred, and unknown items even when the Definition of Done passes.
