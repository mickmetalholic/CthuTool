# LOG template

Save append-only history under `<workspace>/.agent/tasks/<task-id>/LOG.md`. Redact secrets and unrelated sensitive output. Include fields relevant to each event.

```markdown
# Execution Log: <task-id>

Created: <YYYY-MM-DD HH:mm TZ>

## <YYYY-MM-DD HH:mm TZ> — <event type>

Event: <event type>
Phase: <phase ID, or discovery>
Actor: agent / user
Intent / authority: <action; user authorization or decision source; applicable scope>
Actions / targets: <significant actions, exact targets, observations, partial changes>
Result / verification: <outcome; checks and evidence; PASS/FAIL/UNKNOWN>
Recovery / dependencies: <attempts, rollback, retry safety, dependent and independent work>
Next action / decision: <runnable action, or required input and recommendation>
```

Event types: `AUTHORIZATION`, `PHASE_PROPOSED`, `PHASE_RESULT`, `VERIFICATION`, `CHECKPOINT`, `DECISION`, `DECISION_REQUIRED`, `RECOVERY`, `BLOCKED`, `RECONCILIATION`, `FINAL`.

Follow [checkpoint rules](../SKILL.md#execute-and-checkpoint). Keep authorization and decision sources reconstructable across sessions, including when normalizing legacy PLAN fields.
