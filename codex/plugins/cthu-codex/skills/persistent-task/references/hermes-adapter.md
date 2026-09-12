# Hermes invocation adapter

When this shared Skill is installed as a Hermes user Skill, its normal explicit invocation is `/persistent-task`. For example, `/persistent-task resume my-task` runs the resume protocol. If a plugin or other installation registers a qualified name, use that registered name instead.

Hermes can load Skill content with `skill_view(name)`, but loading it for inspection alone does not activate persistent-task mode. The user must explicitly invoke the registered Skill or explicitly ask to enter persistent-task mode. A bare invocation only displays usage.

The `agents/openai.yaml` file contains Codex discovery metadata and does not change the shared workflow. This promotion installs the Skill into CthuCodex only; it does not install or modify any Hermes Skill.
