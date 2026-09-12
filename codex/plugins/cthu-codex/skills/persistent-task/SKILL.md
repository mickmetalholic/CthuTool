---
name: persistent-task
description: Manage explicitly requested long-running, cross-session tasks with durable Markdown state. Use only when the user explicitly invokes the registered persistent-task skill or asks to enter persistent-task mode for system changes, migrations, large file operations, environment setup, or complex troubleshooting; maintain PLAN.md and LOG.md, obtain one confirmation per bounded phase, execute included work autonomously, verify phase results, and report residual issues.
---

# Persistent Task

## Mission

Treat the conversation as temporary reasoning space and the filesystem as durable task state. Keep the current plan small in `PLAN.md` and execution evidence append-only in `LOG.md`.

A phase is the user-facing unit of approval and delivery. Review one bounded phase, then finish its included work and verification without routine pauses. At its boundary, report the result before previewing the next phase. Pause within a phase only when the user must resolve a blocker, a material scope/risk change needs a new preview, or an external action was not included in the approval.

## Explicit activation

Activate only when the user explicitly invokes this skill by its registered name or explicitly asks to enter persistent-task mode. Do not activate it merely because a task looks complex, and do not create task files for ordinary small tasks.

Use the invocation name provided by the current agent. In the forms below, `<invoke>` is that name. See the [Codex adapter](references/codex-adapter.md) and [Hermes adapter](references/hermes-adapter.md) for concrete syntax.

- `<invoke>` — show concise usage and ask for a task description; do not inspect the target, create files, or execute commands.
- `<invoke> <task>` — initialize or resume the explicitly named task.
- `<invoke> resume <task-id>` — run the resume protocol.
- `<invoke> status <task-id>` — read and summarize state without mutating the target.

After activation, `继续` approves only the one unchanged `Current Phase` preview waiting in `PLAN.md` and the most recent message. At the first boundary, it may approve both the coherent plan and its fully previewed first phase. A phase ID such as `执行 P2` is also valid when it matches the preview. A bare `继续` never chooses among unresolved options or approves newly enlarged scope. After context compaction, reconstruct from durable files; if the task and pending preview are still unambiguous, `继续` remains sufficient. In a new session without an identified task, require `<invoke> resume <task-id>`.

## Durable files

For each task, use a separate directory under the workspace being acted on:

```text
<workspace>/.agent/tasks/<task-id>/PLAN.md
<workspace>/.agent/tasks/<task-id>/LOG.md
```

Use the repository/workspace root as `<workspace>`. If the target is not in a repository, use the directory that contains the main target. If the root is ambiguous, ask before creating files. Never store task state inside the Skill installation directory.

Use a short lowercase hyphenated `<task-id>`, preferably prefixed with the date when useful. If multiple active plans exist, identify them explicitly; never silently choose one. Read `PLAN.md` before every phase execution decision. Normally read only the relevant recent `LOG.md` entries; read the full log only when reconstructing uncertain history.

Use [references/plan-template.md](references/plan-template.md) and [references/log-template.md](references/log-template.md) when creating the files.

## Lifecycle

### 1. Initialize and clarify

- Locate the workspace and inspect existing `.agent/tasks/*/PLAN.md` files read-only. If another task has the same target or an unresolved active plan, report the conflict and ask which task to use.
- Create `PLAN.md` and `LOG.md` before changing the target. Creating task-state files is allowed before approval; target mutations are not.
- Set `Status: draft` and `Plan Approval: pending`. Fill in `Goal`, `Scope`, `Out of Scope`, `Constraints`, `Risks`, and `Definition of Done`.
- Ask only high-value clarification questions for unresolved facts that affect target, scope, safety, cost, rollback, verification, or completion. Record answers as `DECISION` events and update `PLAN.md`.
- Keep the target read-only during clarification. Do not present an approval prompt until critical questions and verification criteria are resolved.

When the plan is coherent, prepare the first phase using step 2, then show a compact plan and the full first-phase preview together. Set `Status: awaiting_plan_approval` and `Phase State: proposed`. Tell the user that `继续` approves the plan **and this first phase only**; no second confirmation is needed for its included subtasks.

### 2. Preview one bounded phase

Before asking to continue, update `Current Phase` in `PLAN.md` and append `PHASE_PROPOSED` to `LOG.md`. Show:

- Phase ID, objective, and why its included actions form one coherent unit
- Exact target paths/resources, exclusions, included actions, and batch bounds where relevant
- Expected result and observable verification checks, including final Definition-of-Done checks when this is the last phase
- Material risks, pre-state/backup, rollback or recovery plan, and decisions that would stop the phase

Set `Status: awaiting_phase_approval` for later phases, `Phase State: proposed`, and `Next Action: wait for 继续`. The preview must be concrete enough to review, but need not script every routine subtask. Split a phase when its targets, risks, or rollback cannot be reviewed as one bounded unit. Do not execute a proposed phase before confirmation.

### 3. Execute the approved phase

When the user confirms the exact pending preview, record plan approval if this is the first phase, then set `Status: in_progress` and `Phase State: running`. Append `PHASE_APPROVED` before target work.

Perform all included actions, read-only preflight, corrections within the approved scope, and their checks without asking for another routine confirmation. Do not stop after each command or logical subtask. Stay within the displayed targets, exclusions, and risk bound. If real state shows an unplanned mutation or materially different risk is needed, stop and re-preview the affected phase; prior approval does not cover that change.

For high-impact operations, establish the pre-state and backup/rollback path before mutation. A phase can include several bounded batches if its preview defines the batch set and stop conditions. Verify during execution where needed to avoid compounding an error.

### 4. Verify and checkpoint at the phase boundary

After the included work, verify the phase's expected result against real state; command exit alone is insufficient. Append `PHASE_RESULT`, `VERIFICATION`, and `CHECKPOINT` with actual actions, targets, changed files, evidence, partial results, and redacted errors. Update `PLAN.md` before reporting to the user.

Mark the phase `[x]` only after its required checks pass. For a verified phase, collapse its details in the phase list to a concise verified line, keep evidence in `LOG.md`, and prepare exactly one next-phase preview. A failed or unknown required check keeps the phase incomplete. Record a recoverable issue as a residual only when the Definition of Done and user decisions permit it; otherwise set `Status: blocked`.

The user-facing checkpoint order is mandatory:

1. **Completed phase summary:** outcome, verified evidence, actual changes, and residual/unknown items.
2. **Next phase plan summary:** phase ID, included work and targets, expected result, verification, and risk/rollback.
3. Ask for `继续` to start only that next phase. If there is no next phase, give the final report instead.

Checkpoint at each phase boundary, blocker, cancellation, plan change, or interruption that can be recorded. Individual routine subtasks do not each need a user-facing checkpoint. If execution stops after target action but before a checkpoint, leave `in_progress`; on resume reconcile real state before retrying.

### 5. Handle blockers and changes

When user input is genuinely needed mid-phase, stop the affected target work and update both documents first. Set `Status: blocked`, record observable facts, the exact decision question, options/consequences, and what remains of the approved phase. Append `DECISION_REQUIRED` or `PHASE_BLOCKED`. A bare `继续` does not resolve an ambiguous choice.

After a clear answer, record `DECISION`, reconcile reality, and resume remaining work if it is still inside the approved phase. If the answer changes targets, actions, risk, or rollback materially, replace the preview and await a new phase confirmation. For errors, record partial state, impact, recovery and rollback status; do not blindly repeat a mutation.

### 6. Resume after context loss

On explicit resume:

1. Read all of `PLAN.md` and relevant recent `LOG.md` entries; identify `Goal`, `Status`, `Current Phase`, blockers, `Next Action`, and last verification.
2. Inspect real state for interrupted or recently completed high-impact work. Reality wins; append `RECONCILIATION` and repair the plan when they differ.
3. Treat an interrupted `in_progress` phase as uncertain. Do not replay it automatically. Identify completed and remaining actions from evidence.
4. If an unchanged phase is already awaiting approval, show its preview again. A `继续` received in an ongoing task may approve it after reconciliation when it still matches the latest reviewed scope; otherwise wait for `继续`. If a previously approved phase remains safe to finish within scope, resume after reconciliation; if a decision or material change is needed, use the blocker/preview rules above.
5. For a legacy step-based plan, reconcile its actual state and convert the next bounded work into a phase preview before mutation.

### 7. Finish and report residuals

Include final Definition-of-Done checks in the last approved phase, or preview a separate final-verification phase when the work requires one. Do not request a second step-level confirmation after a phase is approved.

- Use `completed` only when every required Definition-of-Done item passes and no required in-scope issue remains.
- Use `completed_with_followups` only when the Definition of Done passes and the user explicitly accepts listed residual work.
- Use `blocked` when required verification, a required decision, or an in-scope issue remains unresolved.

Update `PLAN.md` and append a final `CHECKPOINT`/`FINAL` before reporting completion. Report completed items, verification evidence, changed targets, errors and recovery, rollback status, residual/unknown issues, deferred decisions, and recommended next actions. Never report a bare “完成”.

## Safety rules

Show exact scope, risk, and rollback within the phase preview for deletion, overwrite, mass move/rename, permission changes, system configuration, service restart, uninstall, migration, data conversion, or other broad or irreversible impact. Bound risky phases to a reviewable batch when possible. Do not add such work mid-phase without a revised preview and confirmation.

Preserve ambiguous, conflicting, damaged, or unverified items; record them as residuals or blockers instead of forcing a choice. Do not send external messages, publish changes, or change an external account/service unless that action and destination were explicitly included in the approved phase or are separately previewed and confirmed.

## Keep PLAN small

Use `PLAN.md` as working memory, not a transcript. Keep the goal, current constraints and decisions, blockers, current phase, next action, and compact phase summaries. Keep detailed history in append-only `LOG.md`; redact secrets.

## References

- [Codex invocation adapter](references/codex-adapter.md)
- [Hermes invocation adapter](references/hermes-adapter.md)
- [PLAN template](references/plan-template.md)
- [LOG template](references/log-template.md)
- [Interaction templates](references/interaction-templates.md)
- [Examples and manual test scenarios](references/examples-and-tests.md)
