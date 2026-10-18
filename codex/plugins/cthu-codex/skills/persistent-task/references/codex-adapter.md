# Codex invocation

| Installation | Invocation | Resume example |
| --- | --- | --- |
| CthuCodex plugin | `$cthu-codex:persistent-task` | `$cthu-codex:persistent-task resume my-task` |
| Direct user Skill | `$persistent-task` | `$persistent-task resume my-task` |

Use the registered name explicitly invoked by the user. Inspection leaves the workflow inactive. A bare invocation shows usage only.

Plugin metadata sets `allow_implicit_invocation: false`. Follow the [shared workflow](../SKILL.md) for execution and task state.
