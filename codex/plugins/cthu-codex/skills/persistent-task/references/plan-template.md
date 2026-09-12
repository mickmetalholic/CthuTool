# Persistent Task Plan

Copy this template into `<workspace>/.agent/tasks/<task-id>/PLAN.md` and replace the placeholders. Keep it short; move execution detail to `LOG.md`.

```markdown
# Task: <short name>

Task ID: <task-id>
Status: draft
Plan Approval: pending
Created: <YYYY-MM-DD HH:mm TZ>
Workspace: <absolute or repository-relative workspace>

## Goal

<One precise outcome.>

## Scope

- In scope: <paths, systems, data, or services>
- Out of scope: <explicit exclusions>

## Constraints

- <safety, compatibility, time, permissions, or user preferences>

## Risks

- <material risk and mitigation, or None>

## Definition of Done

- [ ] <observable completion condition>
- [ ] <verification condition>

## Plan / Phases

- [ ] P1 — <phase>; verify: <observable evidence>
- [ ] P2 — <phase>; verify: <observable evidence>
- [ ] P3 — <last phase including Definition of Done verification, or a separate final-verification phase>

## Current Phase

ID: none
Phase State: clarification
Objective: <one bounded outcome>
Target and Exclusions: <exact targets, scope limits, and excluded items>
Included Work: <related actions and bounded batches>
Expected Result: <observable result>
Verification: <checks and evidence>
Risk / Backup / Rollback: <material risks, pre-state, and recovery path>
Stop Conditions: <decisions or material changes that require a pause>
Approval: <pending / user-confirmed at timestamp / not applicable>

## Pending Questions

- Q1: <question or None>

## Decisions

- <decision that still affects execution, or None>

## Blockers

- <active blocker, or None>

## Verification Status

Last Verification: <not started / pass / fail / unknown>
Evidence: <short path, command, test, or log entry>

## Residual Issues

- <unresolved, deferred, ambiguous, or unknown item, or None>

## Next Action

<Answer Q1 / wait for 继续 to approve current phase / resume approved phase / None>
```

Allowed task statuses:

```text
draft
awaiting_plan_approval
awaiting_phase_approval
in_progress
blocked
completed
completed_with_followups
cancelled
```

Allowed phase states:

```text
clarification
proposed
approved
running
verified
failed
blocked
deferred
```
