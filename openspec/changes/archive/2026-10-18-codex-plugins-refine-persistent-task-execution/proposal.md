## Why

Persistent Task currently requires approval at every phase boundary, including read-only discovery and final verification. Its phase template and examples encourage splitting one outcome into inventory, changes, and checks even when the user can settle the relevant decisions upfront. This adds interruptions without supplying a new decision for the user to make.

## What Changes

- Perform available read-only discovery before asking the user to decide or approve; settle material questions and conditional handling policies before forming execution phases.
- Prefer one complete, verifiable execution phase containing preflight, implementation, recovery, and final checks. Split only when a necessary user decision depends on execution evidence that cannot be obtained or covered by a policy upfront.
- Bind authorization to explicit targets, actions, exclusions, impact limits, recovery, and completion criteria. Preserve existing explicit authorization and continue covered work without approval at routine checkpoints.
- Diagnose recoverable failures within scope, preserve uncertain items, and finish independent authorized work before returning unresolved decisions.
- Persist authorization, dependencies, checkpoints, and recovery evidence; reconcile interrupted and legacy tasks without expanding old phase-only approval.
- Update the shared Skill, state and interaction templates, behavioral scenarios, README, Codex metadata, and existing capability specification together.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codex-plugins-cthu-codex-persistent-task`: Upfront discovery and clarification, decision-dependent phase boundaries, scope-based authorization, uninterrupted execution, recovery, and durable resume behavior.

## Impact

Changes are limited to `codex/plugins/cthu-codex/skills/persistent-task/` and its OpenSpec change and main capability. Explicit activation, task-state locations, Codex/Hermes invocation adapters, and plugin installation remain compatible. Existing task approval is not widened automatically. No runtime code, generated OpenSpec adapters, deployment, remote push, or pull request is included.
