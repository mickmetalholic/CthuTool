---
name: persistent-task
description: Manage explicitly requested long-running, cross-session tasks with durable Markdown state. Use only when the user invokes this skill or requests persistent-task mode; clarify material choices upfront, plan complete execution phases, and continue authorized work through recovery and verification until completion or a genuine blocker.
---

# Persistent Task

## Mission

Treat the conversation as temporary reasoning space and the filesystem as durable task state. Keep the current plan small in `PLAN.md` and execution evidence append-only in `LOG.md`.

Resolve material choices upfront, then complete as much authorized work as possible. Prefer one complete, verifiable execution phase covering preflight, implementation, corrections, recovery, and final checks. A checkpoint records progress; it does not require the user to restart execution.

## Explicit activation

Activate only when the user explicitly invokes this skill by its registered name or asks to enter persistent-task mode. Do not activate merely because a task looks complex or create task files for ordinary small tasks.

Use the invocation name provided by the current agent. In the forms below, `<invoke>` is that name. See the [Codex adapter](references/codex-adapter.md) and [Hermes adapter](references/hermes-adapter.md) for concrete syntax.

- `<invoke>` — show concise usage and ask for a task description; do not inspect the target, create files, or execute commands.
- `<invoke> <task>` — initialize or resume the explicitly named task.
- `<invoke> resume <task-id>` — run the resume protocol.
- `<invoke> status <task-id>` — read and summarize state without mutating the target.

An unambiguous `继续` approves the unchanged execution preview currently awaiting authorization. It never chooses among unresolved options or enlarges scope. Do not request `继续` after routine steps, milestones, or phase results when remaining work is already authorized. After compaction, reconstruct the task and authority from files. In a new session without an identified task, require `<invoke> resume <task-id>`.

## Durable files

For each task, use a separate directory under the target workspace:

```text
<workspace>/.agent/tasks/<task-id>/PLAN.md
<workspace>/.agent/tasks/<task-id>/LOG.md
```

Use the repository/workspace root; outside a repository, use the directory containing the main target. Ask only if the root is genuinely ambiguous. Never store task state inside the Skill installation directory.

Use a short lowercase hyphenated task ID, optionally date-prefixed. Inspect existing plans read-only; if plans overlap or the intended task is ambiguous, resolve that conflict before target mutation. Read `PLAN.md` before execution decisions and relevant recent `LOG.md` entries when evidence is needed.

Use the [PLAN template](references/plan-template.md) and [LOG template](references/log-template.md). Create both before target mutation. Keep authorization evidence, active decisions, dependencies, verification, and the next runnable action in PLAN; keep detailed history and redacted errors in LOG.

## 1. Discover and clarify before planning execution

Inspect the target, available facts, relevant existing plans, and verification options read-only. Routine discovery does not need a phase approval. Do not ask the user for facts that tools can establish.

Resolve material user choices before forming phases: intended outcome, scope/exclusions, preferences or trade-offs, impact limits, cost, recovery, and observable Definition of Done. Ask only questions whose answers change execution. Where possible, agree conditional handling policies upfront, such as preserving conflicts while processing the remaining approved mappings.

Record decisions and their source. Keep unresolved target mutations pending; read-only discovery and task-state updates may continue. A broad request alone does not authorize unspecified high-impact changes. Obtain concrete mappings or remediation evidence through discovery before asking to approve such work.

## 2. Form a complete execution phase and establish authorization

Prefer one phase that delivers the whole verifiable outcome, including preflight, implementation, in-scope fixes, recovery, and final checks. Do not impose a phase count or split solely by command, tool, batch size, operation type, implementation uncertainty, or checkpoint.

Split only when a necessary user decision depends on evidence available only after execution and cannot be settled through prior investigation or an upfront conditional policy. For each real boundary, record:

- Evidence the earlier phase will produce.
- The dependent user decision and work it controls.
- Why discovery or a conditional policy cannot resolve the decision now.

Record the execution scope in `Authorization`: explicit source, targets/actions/exclusions, material impact and recovery limits, completion criteria, agreed conditional policies, and anything still unapproved. Treat the plan as a guide within those bounds, not a frozen command list.

Reuse existing explicit authorization when it already covers the concrete work. Explain the execution plan briefly and proceed; do not ask for the same permission again. If authorization is missing, show a concrete preview of the scope, complete phase, expected result, checks, risk/backup/recovery, and genuine stop conditions. Set `awaiting_authorization` and ask once. Record approval before covered target work.

For deletion, overwrite, mass move/rename, permission or system configuration changes, restart, uninstall, migration, or conversion, make targets, exclusions, impact, and recovery reviewable before mutation. Internal batches and validation can keep a large approved phase safe without separate approvals.

## 3. Execute through verification

Set `in_progress` and execute all currently runnable authorized work. Include necessary preflight, implementation adjustments, corrections, and verification without routine confirmations. Changing an internal command or implementation step does not require approval when targets, outcomes, exclusions, and impact limits remain covered.

Establish pre-state and backup/recovery before high-impact mutations. Verify actual outcomes during execution where needed to avoid compounding errors; command exit alone is insufficient.

For ordinary failures, inspect actual and partial state, attempt reasonable recovery within scope, and verify again. Record attempts and evidence. Do not blindly replay mutations, retry indefinitely without new evidence, or call a required failed/unknown check complete. Use `blocked` only when no safe authorized work remains runnable and progress requires user input or an external prerequisite.

## 4. Checkpoint and keep going

At meaningful milestones, phase results, decisions, plan changes, and recordable interruptions, update PLAN and append execution, verification, and checkpoint evidence to LOG. Routine subtasks do not need separate user-facing checkpoints.

Mark an outcome `[x]` only after its required checks pass. Keep verified phase summaries concise and history in LOG. A failed or unknown required check remains incomplete while in-scope recovery continues.

Report verified progress before any next-work summary, then continue already authorized work. Do not ask for `继续` merely because a checkpoint, milestone, or phase ended. Include final Definition-of-Done checks in the complete execution phase; do not introduce a final-verification approval gate.

If an interruption occurs after target mutation but before a checkpoint, preserve `in_progress`; reconcile real state on resume before retrying.

## 5. Isolate genuine blockers and decisions

Suspend affected work when it requires a necessary user decision, material scope/impact expansion, an unapproved external action, an unavailable permission/prerequisite, or an explicit user pause. Preserve ambiguous, conflicting, damaged, and unverified items.

Record the observed facts, affected targets, partial/recovery state, exact decision or external prerequisite, options/consequences, recommendation, and dependent work. Continue safe independent authorized work only when it cannot constrain the unresolved choice, compound a failure, or change shared uncertain state. An explicit user request to pause the whole task stops all work.

While independent work remains, keep the task `in_progress` and list the blocked parts separately. When no safe runnable work remains, checkpoint, set `blocked` (or `awaiting_authorization` for a concrete uncovered preview), and ask only for the remaining decision or prerequisite. Batch independent pending decisions when useful.

After a clear answer, record it, reconcile reality, and continue covered work. If the answer explicitly authorizes a concretely described change, record that authorization without asking the same question again. Otherwise obtain authorization for material expansion before affected work. A bare `继续` cannot resolve an ambiguous choice.

Do not send external messages, publish changes, or change an external account/service unless the action and destination are explicitly authorized. Task persistence does not override host permissions.

## 6. Resume after context loss

On explicit resume:

1. Read all of PLAN and relevant recent LOG entries, including authorization sources, remaining work, decisions/dependencies, and last verification.
2. Inspect real state for interrupted or recently completed high-impact work. Reality wins; append `RECONCILIATION` and repair the plan when they differ.
3. Identify completed and remaining actions from evidence. Do not automatically replay an interrupted mutation.
4. Continue safe remaining authorized work without a new confirmation. If authorization is genuinely missing, show the unchanged or revised concrete preview; an unambiguous `继续` can approve it after reconciliation.
5. For legacy step/phase plans, reconstruct the actual approved scope from the plan and log. An old `Plan Approval: approved` flag or approval of P1 does not authorize P2. Normalize current state without rewriting log history; preserve still-valid approval and request only genuinely missing decisions or authorization.

## 7. Finish and report residuals

- Use `completed` only when every required Definition-of-Done item passes and no required in-scope issue remains.
- Use `completed_with_followups` only when the Definition of Done passes and the user explicitly accepts listed residual work.
- Keep `in_progress` while safe authorized work or reasonable recovery remains.
- Use `blocked` when remaining required work needs a user decision or external prerequisite and no safe independent work remains. A voluntary user pause is `paused`.

Update PLAN and append `FINAL` before reporting completion. Report completed outcomes, verification evidence, changed targets, errors/recovery, rollback state, residual/unknown issues, and deferred decisions. Do not claim completion from a successful command alone.

## References

- [Codex invocation adapter](references/codex-adapter.md)
- [Hermes invocation adapter](references/hermes-adapter.md)
- [PLAN template](references/plan-template.md)
- [LOG template](references/log-template.md)
- [Interaction templates](references/interaction-templates.md)
- [Examples and manual test scenarios](references/examples-and-tests.md)
