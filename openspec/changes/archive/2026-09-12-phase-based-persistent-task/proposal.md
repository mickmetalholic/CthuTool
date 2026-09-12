## Why

The current `persistent-task` workflow pauses after every logical step, making a long task require too many confirmations. A phase should be the user-facing execution unit: the agent completes its included work and verifies it before asking to continue.

## What Changes

- Replace step-by-step execution approval with one review and confirmation per bounded phase. The initial `继续` may approve the plan and its explicitly previewed first phase together.
- Run included subtasks autonomously within an approved phase; pause mid-phase only for a decision the user must make, material scope/risk change, or an unapproved external action.
- After each phase, persist and report the verified result first, then summarize the next phase. A plain `继续` approves only that unchanged next-phase preview.
- Update the Skill, Codex metadata, templates, examples, and durable-state specification while keeping the shared workflow usable in Codex and Hermes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codex-plugins-cthu-codex-persistent-task`: Phase approval, autonomous in-phase execution, phase checkpoints, continuation, and cross-agent behavior.

## Impact

Only `codex/plugins/cthu-codex/skills/persistent-task/` and its existing OpenSpec capability change. No generated OpenSpec adapters or other plugin content change.
