# Persistent Task Log

`LOG.md` is append-only execution history. Do not use it as the current state; summarize current state in `PLAN.md`. Redact credentials, tokens, cookies, private keys, and unrelated sensitive output.

```markdown
# Execution Log: <task-id>

Created: <YYYY-MM-DD HH:mm TZ>

## <YYYY-MM-DD HH:mm TZ> — <event type>

Event: STEP_PROPOSED | STEP_APPROVED | STEP_RESULT | VERIFICATION | CHECKPOINT | DECISION | DECISION_REQUIRED | STEP_BLOCKED | RECONCILIATION | FINAL
Step: <step ID>
Actor: agent / user

### Intended action

<What was proposed or approved.>

### Actual action and targets

<What actually happened; include commands or concise operation details.>

### Result

<Success, failure, partial, skipped, or unknown.>

### Verification

<Checks run, observable evidence, and PASS/FAIL/UNKNOWN.>

### Changes / rollback

<Files, services, data, backups, rollback, or None.>

### Next action / decision

<What happens next, or the exact user decision required.>
```

For failed or interrupted work, preserve enough detail to reconstruct the real state: attempt number, exit/result summary, partial changes, recovery attempted, and whether the original action is safe to retry.
