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

## Definition of Done

- [ ] <observable completion condition>
- [ ] <verification condition>

## Plan / Phases

- [ ] P1 — <phase>; verify: <observable evidence>
- [ ] P2 — <phase>; verify: <observable evidence>
- [ ] Final — complete Definition of Done verification

## Current Step

ID: none
Step State: clarification
Target: <exact target or none>
Proposed Action: <one logical action>
Expected Result: <observable result>
Verification: <checks and evidence>
Rollback: <rollback or None>
Confirmation: <pending / user-confirmed / not applicable>

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

<Answer Q1 / approve plan / wait for step confirmation / perform final verification / None>
```

Allowed task statuses:

```text
draft
awaiting_plan_approval
awaiting_step_approval
in_progress
blocked
awaiting_final_verification
completed
completed_with_followups
cancelled
```

Allowed step states:

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
