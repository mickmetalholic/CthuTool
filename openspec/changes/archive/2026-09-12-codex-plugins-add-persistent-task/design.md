## Context

The selected Skill is already adapted as nine untracked files under `codex/plugins/cthu-codex/skills/persistent-task/`. There is no existing persistent-task capability spec. CthuCodex is explicitly the target business plugin; generated OpenSpec adapter Skills are unrelated.

## Goals / Non-Goals

**Goals:** Publish a reviewable source snapshot with one shared task protocol, agent-specific invocation adapters, and templates that make step approvals and verification durable.

**Non-Goals:** Add a `chc codex skills` manifest entry, synchronize installations between agents, or claim that installing the Codex plugin automatically registers a Hermes Skill.

## Decisions

### Keep one shared workflow and two invocation adapters

`SKILL.md` owns activation, plan/log lifecycle, approvals, and checkpoints. `references/codex-adapter.md` and `references/hermes-adapter.md` explain only agent-specific invocation and loading. This keeps the same operational rules in both agents without requiring identical installation paths.

### Store task state under the target workspace

The Skill writes `.agent/tasks/<task-id>/PLAN.md` and `LOG.md` in the workspace it operates on, not in plugin source or cache. This allows repository publication and plugin cache updates without moving active task state.

### Publish source without changing the user's installations

The PR carries the Skill source and OpenSpec capability. A later explicit installation can register it in Codex or Hermes. This avoids undoing the user's recent local plugin-cache cleanup and avoids claiming Hermes runtime availability from a Codex plugin cache.

## Risks / Trade-offs

- [Unapproved target mutation] → Separate plan approval from one-step execution confirmation and record both in durable state.
- [Agent-specific invocation drift] → Keep adapter files explicit and validate all referenced files and metadata.
- [Repository source mistaken for local installation] → State the installation boundary in the README and spec.

## Migration Plan

Archive only this change, publish the selected nine-file Skill tree in one PR, and merge after checks. Local Codex and Hermes installations remain separate operational actions.
