# Hermes invocation

Install this Skill separately in a supported Hermes Skill location. CthuCodex plugin installation applies to Codex.

The usual invocation is `/persistent-task`; use a qualified name if the installation registers one. Example: `/persistent-task resume my-task`.

`skill_view(name)` loads content for inspection. Activation requires the user's explicit invocation or request for persistent-task mode. A bare invocation shows usage only.

Follow the [shared workflow](../SKILL.md) for execution and task state. `agents/openai.yaml` supplies Codex metadata.
