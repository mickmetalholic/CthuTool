# PLAN template

Save under `<workspace>/.agent/tasks/<task-id>/PLAN.md`. Keep current state compact; put execution history in LOG.

```markdown
# Task: <short name>

Task ID: <task-id>
Status: draft
Created: <YYYY-MM-DD HH:mm TZ>
Workspace: <workspace path>

## Goal

<One precise outcome.>

## Scope and Constraints

- In scope: <targets, actions, outcomes>
- Out of scope: <exclusions>
- Constraints: <compatibility, impact/cost limits, preferences>
- Risks / recovery: <risks, pre-state, backup, recovery path>

## Definition of Done

- [ ] <observable completion condition>
- [ ] <final verification condition>

## Authorization

State: <pending / authorized / partial>
Source: <user instruction/confirmation, timestamp, LOG reference>
Covered Work: <scope above or authorized subset, including impact/recovery limits>
Conditional Policies: <agreed handling rules, or None>
External Actions: <authorized action and destination, or None>
Not Yet Authorized: <uncovered work, or None>

## Phase Plan

- [ ] P1 — <complete outcome, including recovery and final checks>

## Decision Dependencies

- <required execution evidence; dependent choice and work; why the choice must wait, or None>

## Current Work

Phase: <phase ID>
Phase State: <ready / running / verified / blocked / deferred>
Objective: <complete outcome or evidence needed for a decision>
Included Work: <actions, milestones, batches>
Verification: <checks and evidence>
Authorization Reference: <source covering this work, or pending>
Next Runnable Work: <safe authorized action, or None>

## Pending Decisions and Blocked Work

- <facts; decision/prerequisite; recommendation/options; affected work; independent work, or None>

## Decisions

- <confirmed choice still affecting execution, with source, or None>

## Verification and Residuals

Last Verification: <not started / pass / fail / unknown>
Evidence: <command, path, result, or LOG reference>
Residual Issues: <unresolved, deferred, or unknown items, or None>
Recovery State: <partial changes, attempts, backup/rollback, or None>

## Next Action

<Continue work / recover / await a named decision or authorization / resolve a prerequisite / None>
```

Add phases according to the [phase boundary rule](../SKILL.md#plan-complete-phases).

Task statuses: `draft`, `awaiting_authorization`, `in_progress`, `blocked`, `paused`, `completed`, `completed_with_followups`, `cancelled`. Their execution conditions are in [Finish](../SKILL.md#finish).

Recognize legacy fields `Plan Approval`, `Current Phase`, `awaiting_plan_approval`, and `awaiting_phase_approval` during [resume](../SKILL.md#resume).
