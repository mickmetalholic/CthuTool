# Codex invocation adapter

The shared instructions use `<invoke>` for the name registered by the current agent.

| Installation | `<invoke>` | Example |
| --- | --- | --- |
| CthuCodex plugin | `$cthu-codex:persistent-task` | `$cthu-codex:persistent-task resume my-task` |
| Direct Codex user Skill | `$persistent-task` | `$persistent-task resume my-task` |

Use the form the user explicitly invoked. A mention of a Skill file or an agent loading the file for inspection does not activate persistent-task mode. A bare invocation only displays usage; it does not inspect a target or create task files.

`agents/openai.yaml` disables implicit invocation for this plugin Skill. Keep task state under the target workspace's `.agent/tasks/<task-id>/`, never inside the Skill installation directory.
