## Purpose

Define the CthuCodex persistent-task Skill's explicit activation, durable task-state protocol, human approval boundaries, and portable behavior for Codex and Hermes.

## ADDED Requirements

### Requirement: Persistent tasks require explicit activation

The `persistent-task` Skill SHALL activate only when the user explicitly invokes its registered name or explicitly requests persistent-task mode. A bare invocation SHALL show usage without reading a target or creating task files.

#### Scenario: Bare invocation is side-effect free

- **WHEN** the user invokes `persistent-task` without a task description
- **THEN** the agent shows concise usage
- **AND** it does not inspect a target, create task state, or execute work

#### Scenario: Ordinary complex work does not activate the Skill

- **WHEN** a task looks long-running but the user has not explicitly invoked the Skill or requested persistent-task mode
- **THEN** the agent follows its ordinary workflow and does not create persistent-task files

### Requirement: Task state is durable and checkpointed

For an activated task, the Skill SHALL keep a current `PLAN.md` and append-only `LOG.md` under the target workspace's `.agent/tasks/<task-id>/` directory. It SHALL record the plan, decisions, step proposals, execution results, verification, and residual issues so a later session can resume from files rather than conversation memory.

#### Scenario: Task initialization creates durable state

- **WHEN** the user activates the Skill for a new named task with a resolved workspace
- **THEN** the agent creates the task's `PLAN.md` and `LOG.md` before changing the target
- **AND** the initial plan remains unapproved until the user explicitly approves it

#### Scenario: Resume reconstructs current state

- **WHEN** the user explicitly resumes a task in a later session
- **THEN** the agent reads the current plan and relevant log entries before proposing another action
- **AND** it reports unresolved decisions and verified progress

### Requirement: Target mutations are approved one step at a time

The Skill SHALL require explicit plan approval and a separate user confirmation for each bounded logical execution step. It SHALL show the step's target, action, expected result, verification, and rollback before asking for execution approval. A general continuation SHALL NOT authorize a new or changed step.

#### Scenario: Plan approval does not execute a step

- **WHEN** the user approves the plan
- **THEN** the agent records the approval and proposes one bounded step
- **AND** it does not mutate the target until that step is confirmed

#### Scenario: Confirmed step is verified and recorded

- **WHEN** the user confirms the exact proposed step
- **THEN** the agent records approval, executes only the reviewed scope, verifies the actual result, and checkpoints `PLAN.md` and `LOG.md`
- **AND** it does not mark success from command exit alone

#### Scenario: Changed scope stops execution

- **WHEN** the target or required action differs materially from the confirmed step
- **THEN** the agent stops, records the discrepancy, and presents a new proposal for confirmation

### Requirement: Shared behavior is portable across Codex and Hermes

The Skill SHALL keep the durable-task workflow in shared instructions and templates, with separate Codex and Hermes adapters for invocation and agent-specific behavior. Codex plugin metadata SHALL disable implicit invocation. Installing the CthuCodex plugin SHALL NOT be represented as installing the Skill into Hermes.

#### Scenario: Codex plugin invocation uses explicit metadata

- **WHEN** CthuCodex exposes the Skill to Codex
- **THEN** its `agents/openai.yaml` disables implicit invocation and documents the qualified plugin invocation

#### Scenario: Hermes uses the same workflow after separate installation

- **WHEN** the shared Skill is installed in a supported Hermes Skill location and explicitly invoked there
- **THEN** its Hermes adapter supplies the invocation mapping without changing plan, step, or checkpoint semantics
- **AND** a Codex-only plugin installation is not claimed as Hermes availability
