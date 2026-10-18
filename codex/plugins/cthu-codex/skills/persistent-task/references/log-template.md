# Persistent Task Log

LOG is append-only execution history; summarize current state in PLAN. Redact credentials, tokens, cookies, private keys, and unrelated sensitive output.

```markdown
# Execution Log: <task-id>

Created: <YYYY-MM-DD HH:mm TZ>

## <YYYY-MM-DD HH:mm TZ> — <event type>

Event: AUTHORIZATION | PHASE_PROPOSED | PHASE_RESULT | VERIFICATION | CHECKPOINT | DECISION | DECISION_REQUIRED | RECOVERY | BLOCKED | RECONCILIATION | FINAL
Phase: <phase ID, or discovery>
Actor: agent / user

### Intent and authority

<Goal/action; explicit authorization or decision source; applicable targets, exclusions, bounds, and policies. An agent-generated plan alone grants no permission.>

### Actual action and targets

<Significant actions, observed facts, exact targets, and partial changes.>

### Result and verification

<Success/failure/partial/unknown; checks, evidence, and PASS/FAIL/UNKNOWN.>

### Recovery and dependencies

<Attempts, backup/rollback, retry safety, affected dependent work, and safe independent work, or None.>

### Next action / decision

<Next runnable authorized action, or the exact necessary user decision or external prerequisite and recommendation.>
```

Checkpoint at meaningful milestones, phase boundaries, decisions, plan changes, and recordable interruptions. A checkpoint does not require a new user confirmation; continue covered work. Routine included subtasks need no individual event.

Record authorization before the covered target mutation. Keep decision and approval sources reconstructable after compaction. For failed or interrupted work, record attempt/result, partial state, recovery, and whether replay is safe. Never rewrite historical entries when adapting a legacy task.
