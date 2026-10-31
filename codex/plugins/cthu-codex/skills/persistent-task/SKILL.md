---
name: persistent-task
description: Manage explicitly requested long-running, cross-session tasks using PLAN.md and LOG.md. Clarify choices upfront and complete authorized work through recovery and verification. Activate only on explicit invocation or a request for persistent-task mode.
---

# Persistent Task

Resolve material choices upfront, prefer one complete execution phase, and continue until completion or a decision or external dependency prevents further authorized work.

## Invocation

Use the name registered by the current agent; see the [Codex](references/codex-adapter.md) and [Hermes](references/hermes-adapter.md) adapters.

| Invocation | Action |
| --- | --- |
| `<invoke>` | Show usage only. |
| `<invoke> <task>` | Initialize or resume the named task. |
| `<invoke> resume <task-id>` | Reconstruct state and continue the task. |
| `<invoke> status <task-id>` | Read and summarize state only. |

`继续` approves the unchanged execution preview awaiting authorization. Unresolved choices require explicit answers. After compaction, recover the task and authorization from its files. In a new session without an identified task, require an explicit resume invocation.

## Durable state

Create these files before target mutation:

```text
<workspace>/.agent/tasks/<task-id>/PLAN.md
<workspace>/.agent/tasks/<task-id>/LOG.md
```

Use the repository/workspace root, or the main target's containing directory outside a repository. Resolve an ambiguous root or overlapping active tasks before mutation. Choose a short lowercase hyphenated task ID, optionally date-prefixed.

Use the [PLAN](references/plan-template.md) and [LOG](references/log-template.md) templates. Keep the current goal, scope, authorization source, decisions, dependencies, verification, and next action in PLAN. Keep detailed execution history append-only in LOG and redact secrets.

Read PLAN before choosing the next action. Read recent LOG entries for evidence; expand the history read when reconstruction requires it.

## Plan complete phases

Inspect available facts and verification options read-only first. Ask only for unresolved choices affecting outcome, scope, trade-offs, impact, cost, recovery, or Definition of Done. Agree conditional handling policies upfront where possible.

Prefer one phase delivering the whole outcome: preflight, implementation, corrections, recovery, and final checks. Keep commands, tools, batches, and checkpoints within that phase.

Split only when a necessary user decision requires execution evidence and cannot be resolved through prior investigation or an upfront conditional policy. Record the evidence to produce, the dependent choice and work, and why the choice must wait.

Record concrete authorization: source, targets/actions/exclusions, impact and recovery limits, completion criteria, conditional policies, and pending permissions. Adjust internal implementation steps within those bounds. Explicit authorization is required for external actions and their destinations.

Reuse existing authorization. For uncovered work, present its scope, complete phase, expected result, checks, risks/recovery, and stop conditions; set `awaiting_authorization` and request confirmation once. Record authorization before covered target work.

For destructive, bulk, system, permission, or service changes, make exact targets and impact reviewable and establish pre-state, backup, and recovery before mutation.

## Execute and checkpoint

Set `in_progress` and perform all runnable authorized work through verification. Check real outcomes during execution where an error could compound.

On failure, inspect partial state, attempt reasonable in-scope recovery, and verify again. Record attempts and retry only when evidence supports a safe correction.

At meaningful milestones, phase results, decisions, plan changes, and recordable interruptions, update PLAN and append actions, targets, results, verification, and recovery evidence to LOG. Report verified progress before the next-work summary, then continue covered work.

Mark outcomes `[x]` after required checks pass. Failed or unknown checks remain incomplete. Include final Definition-of-Done checks in the execution phase.

If mutation precedes an interrupted checkpoint, preserve `in_progress` and reconcile real state before retrying.

## Decisions and blockers

Suspend affected work for a necessary user decision, material scope/impact expansion, an unapproved external action, a missing permission/prerequisite, or an explicit pause. Preserve conflicting, damaged, ambiguous, and unverified items.

Continue independent authorized work while it remains safe for the unresolved choice and shared state. Keep the task `in_progress` while work or reasonable recovery remains. An explicit pause of the whole task stops all work.

When remaining work needs input, checkpoint and present the facts, partial/recovery state, exact decision or prerequisite, options, consequences, recommendation, and affected work. Group independent pending decisions when useful.

Record a clear answer, reconcile reality, and continue. An answer that explicitly authorizes a described change supplies its authorization; request only permissions still missing. Host permissions remain controlling.

## Resume

1. Read PLAN and recent LOG, including authorization sources, remaining work, decisions, dependencies, and verification.
2. Inspect real state for interrupted or recently completed high-impact work. Append `RECONCILIATION` and correct the plan where needed.
3. Identify completed and remaining actions from evidence, then continue safe authorized work.
4. Resolve missing decisions or authorization using the rules above.
5. For legacy plans, reconstruct the approved scope from PLAN and LOG. P1-only approval remains limited to P1. Normalize current fields while preserving historical entries and valid authorization.

## Finish

| Status | Condition |
| --- | --- |
| `in_progress` | Safe authorized work or reasonable recovery remains. |
| `awaiting_authorization` | A concrete execution preview needs approval. |
| `blocked` | Remaining required work needs user input or an external prerequisite. |
| `paused` | The user explicitly paused the task. |
| `completed` | Every required Definition-of-Done check passes; required in-scope work is resolved. |
| `completed_with_followups` | Definition of Done passes and the user explicitly accepts listed residual work. |

Before reporting completion, update PLAN and append `FINAL`. Include verified outcomes, changed targets, errors/recovery, rollback state, and residual, unknown, or deferred items.

Use [interaction templates](references/interaction-templates.md) as needed. Review behavior changes against the [acceptance scenarios](references/examples-and-tests.md).
