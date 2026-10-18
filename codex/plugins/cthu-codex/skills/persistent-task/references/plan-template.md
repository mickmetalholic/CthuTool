# Persistent Task Plan

Copy this template into `<workspace>/.agent/tasks/<task-id>/PLAN.md`. Keep current state compact and move execution history to LOG.

```markdown
# Task: <short name>

Task ID: <task-id>
Status: draft
Created: <YYYY-MM-DD HH:mm TZ>
Workspace: <workspace path>

## Goal

<One precise outcome.>

## Scope and Constraints

- In scope: <targets, actions, and observable outcomes>
- Out of scope: <exclusions>
- Constraints: <compatibility, impact/cost limits, and user preferences>
- Risks / recovery: <material risks, pre-state, backup, and recovery path>

## Definition of Done

- [ ] <observable completion condition>
- [ ] <final verification condition>

## Authorization

State: <pending / authorized / partial>
Source: <explicit user instruction or confirmation, timestamp and LOG reference>
Covered Work: <targets/actions/exclusions and impact/recovery bounds>
Conditional Policies: <agreed handling rules, or None>
External Actions: <authorized action and destination, or None>
Not Yet Authorized: <concrete uncovered work, or None>

## Phase Plan

- [ ] P1 — <complete verifiable outcome, including implementation, recovery, and final checks>

<Add another phase only for a necessary user decision that depends on execution evidence and cannot be settled through discovery or an upfront conditional policy. Internal steps and checkpoints stay inside the phase.>

## Decision Dependencies

- <evidence an earlier phase must produce; dependent user choice and work; why it cannot be settled upfront, or None>

## Current Work

Phase: <phase ID>
Phase State: <ready / running / verified / blocked / deferred>
Objective: <complete outcome or decision-ready evidence>
Included Work: <related actions, internal milestones, and bounded batches>
Verification: <observable checks and evidence>
Authorization Reference: <source covering this work, or pending>
Next Runnable Work: <safe authorized work that can proceed now, or None>

## Pending Decisions and Blocked Work

- <observed facts; exact decision or prerequisite; recommendation/options; affected work; independent work that may continue, or None>

## Decisions

- <confirmed choice or conditional policy still affecting execution, with source, or None>

## Verification and Residuals

Last Verification: <not started / pass / fail / unknown>
Evidence: <short command, path, result, or LOG reference>
Residual Issues: <unresolved, deferred, or unknown items, or None>
Recovery State: <partial changes, attempts, backup/rollback status, or None>

## Next Action

<Continue authorized work / perform in-scope recovery / await a named decision or concrete authorization / resolve an external prerequisite / None>
```

Allowed task statuses:

```text
draft
awaiting_authorization
in_progress
blocked
paused
completed
completed_with_followups
cancelled
```

`blocked` means no safe authorized work remains runnable and required progress needs a user decision or external prerequisite. A local blocker with independent runnable work leaves the task `in_progress`. Use `paused` only for an explicit user pause.

On resume, read legacy fields such as `Plan Approval`, `Current Phase`, `awaiting_plan_approval`, and `awaiting_phase_approval` alongside LOG evidence. Normalize current state while preserving the original approved scope; an old phase-only approval never expands to the whole plan.
