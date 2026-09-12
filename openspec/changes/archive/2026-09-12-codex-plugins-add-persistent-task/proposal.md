## Why

The local `persistent-task` workflow has been adapted for Codex and Hermes, but its nine-file source still exists only as an uncommitted checkout addition. Publishing it as a CthuCodex Skill gives the reviewed long-running-task workflow a durable repository source without depending on a direct Codex user Skill copy.

## What Changes

- Add the explicitly invoked `persistent-task` Skill to the CthuCodex plugin with an agent-neutral workflow, durable `PLAN.md` and `LOG.md` templates, and separate Codex and Hermes invocation adapters.
- Preserve plan approval and one confirmation per bounded execution step, with verification and recorded checkpoints.
- Document that CthuCodex installation provides the Codex entry point; Hermes needs a separate installation of the compatible shared Skill.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-persistent-task`: Explicit activation, durable state, step approval, verification, and cross-agent content compatibility for the plugin Skill.

### Modified Capabilities

- None.

## Impact

- `codex/plugins/cthu-codex/skills/persistent-task/` source and its new OpenSpec capability.
- No generated OpenSpec adapters, third-party Skill manifest, or unrelated plugin files.
