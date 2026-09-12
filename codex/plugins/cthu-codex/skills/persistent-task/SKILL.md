---
name: persistent-task
description: Manage explicitly requested long-running, multi-step, cross-session tasks with durable Markdown state. Use only when the user explicitly invokes the registered persistent-task skill or explicitly asks to enter persistent-task mode for system changes, migrations, large file operations, environment setup, or complex troubleshooting; create and maintain PLAN.md and LOG.md, require plan approval and one user confirmation per logical step, verify before completion, and report residual issues.
---

# Persistent Task

## Mission

Treat the conversation as temporary reasoning space and the filesystem as durable task state. Keep the current plan small and operational in `PLAN.md`; keep execution evidence and history append-only in `LOG.md`.

This is a human-gated workflow. Pause at every approval boundary, record the checkpoint, and wait for the user's next explicit instruction.

## Explicit activation

Activate only when the user explicitly invokes this skill by its registered name or explicitly asks to enter persistent-task mode. Do not activate it merely because a task looks complex, and do not create task files for ordinary small tasks.

Use the invocation name provided by the current agent. In the forms below, `<invoke>` is that name. See the [Codex adapter](references/codex-adapter.md) and [Hermes adapter](references/hermes-adapter.md) for concrete syntax.

- `<invoke>` — show concise usage and ask for a task description; do not inspect the target, create files, or execute commands.
- `<invoke> <task>` — initialize or resume the explicitly named task.
- `<invoke> resume <task-id>` — run the resume protocol.
- `<invoke> status <task-id>` — read and summarize state without mutating the target.

After activation, a response such as `执行 P2` confirms only the exact step preview currently shown. `继续` is sufficient only when exactly one step is awaiting confirmation and its scope has not changed. Never treat a vague continuation as approval for a new, changed, or destructive action.

After context compaction or a new session, require an explicit `<invoke> resume ...`; do not rely on the old conversation.

## Durable files

For each task, use a separate directory under the workspace being acted on:

```text
<workspace>/.agent/tasks/<task-id>/PLAN.md
<workspace>/.agent/tasks/<task-id>/LOG.md
```

Use the repository/workspace root as `<workspace>`. If the target is not in a repository, use the directory that contains the main target. If the root is ambiguous, ask before creating files. Never store task state inside the Skill installation directory.

Use a short lowercase hyphenated `<task-id>`, preferably prefixed with the date when useful. If multiple active plans exist, identify them explicitly; never silently choose one.

Read `PLAN.md` before every execution decision. Normally read only the relevant recent entries of `LOG.md`; read the full log only when reconstructing uncertain history.

Use [references/plan-template.md](references/plan-template.md) and [references/log-template.md](references/log-template.md) when creating the files.

## Lifecycle

### 1. Initialize and clarify

- Locate the workspace and inspect existing `.agent/tasks/*/PLAN.md` files read-only.
- If another task has the same target or an unresolved active plan, report the conflict and ask which task to use.
- Create `PLAN.md` and `LOG.md` before changing the target. Creating these task-state files is allowed before plan approval; target mutations are not.
- Set `Status: draft` and `Plan Approval: pending`.
- Fill in `Goal`, `Scope`, `Out of Scope`, `Constraints`, `Risks`, and `Definition of Done` from the request.
- Ask numbered clarification questions for every unresolved item that can change scope, safety, cost, target, rollback, verification, or completion. Ask only a small batch of high-value questions at a time.
- Record each answer as a `DECISION` in `LOG.md` and update the relevant current section of `PLAN.md`.
- Keep the target read-only during clarification and planning.

Do not request plan approval while critical questions, missing targets, undefined verification, or unsafe assumptions remain. When the plan is coherent, set `Status: awaiting_plan_approval`, show the compact plan, and ask explicitly for plan approval. Plan approval never authorizes target mutation.

### 2. Propose exactly one step

Before asking for execution approval, update `PLAN.md` with the proposed step and append `STEP_PROPOSED` to `LOG.md`.

Show exactly one bounded logical step containing:

- Step ID and objective
- Exact target paths/resources and exclusions
- Actions or commands to perform
- Expected result
- Verification checks and evidence to collect
- Risk, backup, and rollback plan
- Any decision that would cause the step to stop

Set `Status: awaiting_step_approval`, `Step State: proposed`, and `Next Action: wait for confirmation`. Do not execute while the step is merely proposed.

### 3. Execute only after confirmation

When the user confirms the exact proposal:

- Update `PLAN.md` to `Status: in_progress`, `Step State: running`, and record the approval.
- Append `STEP_APPROVED` to `LOG.md` before acting.
- Execute only the displayed scope. If reality requires an unplanned mutation, stop and replan.
- Do not run multiple independent logical steps under one confirmation. Split a step if it becomes too broad.

A read-only preflight may be part of the confirmed step. Any newly discovered mutation, broader scope, or higher risk requires a new preview and confirmation.

### 4. Verify and checkpoint immediately

After the action:

- Append `STEP_RESULT` to `LOG.md` with the actual action, targets, result, changed files, output summary, and redacted errors/secrets.
- Verify the real state using checks tied to the step's expected result. A successful command exit code alone is not verification.
- Append `VERIFICATION` and `CHECKPOINT` to `LOG.md`.
- Update `PLAN.md` before reporting the result to the user.

For a verified success, mark the step `[x]`, record evidence, clear or update `Current Step`, and prepare the next proposed step with `Status: awaiting_step_approval`. For failure, partial success, or unknown state, set `Status: blocked`, preserve the actual state, and record the decision required. Never mark `[x]` without verification.

This document checkpoint is mandatory after every logical step, including read-only steps, failed attempts, deferred steps, cancellations, and plan changes. No state may exist only in the conversation.

If execution is interrupted after the target action but before the final checkpoint, leave the plan as `in_progress`. On resume, reconcile the real state and log before retrying anything.

### 5. Handle decisions and errors

When user input is needed, stop target changes and update both documents first:

- Set `Status: blocked`.
- Record the observable facts, the decision question, options, consequences, and the exact reply needed in `PLAN.md`.
- Append `DECISION_REQUIRED` or `STEP_BLOCKED` to `LOG.md`.
- Do not infer a choice from silence or a vague `继续`.

For an error or failed verification, record the command/action, target, observed result, partial state, impact, attempted recovery, rollback status, and next action. Do not blindly retry the same mutation. Reinspect reality, update the plan, and obtain a new confirmation when the action or risk changes.

### 6. Resume after context loss

On explicit resume:

1. Locate the task directory and read all of `PLAN.md`.
2. Identify `Goal`, `Status`, `Current Step`, `Next Action`, blockers, and last verification.
3. Read the relevant recent `LOG.md` entries, not the entire history by default.
4. Inspect important real-world state for the current step and recently completed high-impact steps.
5. Compare reality with `PLAN.md`. Reality wins; repair the plan and append a `RECONCILIATION` entry when they differ.
6. Treat an interrupted `in_progress` step as uncertain until verified. Do not repeat it automatically.
7. Present one new step preview and wait for confirmation.

### 7. Finish and report residuals

When all planned phases are complete, create a separate final-verification step. Set `Status: awaiting_final_verification`, show the complete DoD-to-check mapping, and ask for confirmation before running it.

After final verification:

- Use `completed` only when every required DoD item passes and no required in-scope issue remains.
- Use `completed_with_followups` only when the DoD passes and the user explicitly accepts listed residual work.
- Use `blocked` when required verification, a required decision, or an in-scope issue remains unresolved.
- Update `PLAN.md` and append a final `CHECKPOINT` before reporting completion.

Always report completed items, verification evidence, changed targets, errors and recovery, rollback status, residual/unknown issues, deferred decisions, and recommended next actions. Never report a bare “完成”.

## Safety rules

Require explicit step confirmation after showing exact scope and rollback for deletion, overwrite, mass move/rename, permission changes, system configuration, service restart, uninstall, migrations, data conversion, or any action that could cause irreversible or broad impact. Split risky operations into smaller steps when possible.

Before destructive work, establish the pre-state and backup/rollback path in the plan. Preserve ambiguous, conflicting, damaged, or unverified items; record them as residuals or blockers instead of forcing a choice.

Do not send external messages, publish changes, or make external account/service changes without a separately shown and confirmed step.

## Keep PLAN small

Use `PLAN.md` as working memory, not a transcript. Keep only the current goal, constraints, decisions that still affect execution, active blockers, current step, next action, and compact phase summaries. After a phase is fully verified, collapse its detailed checklist to one verified summary line and retain details in `LOG.md`. Do not rewrite or truncate `LOG.md`; append history and redact secrets.

## References

- [Codex invocation adapter](references/codex-adapter.md)
- [Hermes invocation adapter](references/hermes-adapter.md)
- [PLAN template](references/plan-template.md)
- [LOG template](references/log-template.md)
- [Interaction templates](references/interaction-templates.md)
- [Examples and manual test scenarios](references/examples-and-tests.md)
