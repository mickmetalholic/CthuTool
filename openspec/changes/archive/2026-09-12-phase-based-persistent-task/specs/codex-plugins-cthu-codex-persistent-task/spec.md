## MODIFIED Requirements

### Requirement: Task state is durable and checkpointed

For an activated task, the Skill SHALL keep a current `PLAN.md` and append-only `LOG.md` under the target workspace's `.agent/tasks/<task-id>/` directory. It SHALL record the plan, decisions, phase proposals and approvals, execution results, phase verification, blockers, and residual issues so a later session can resume from files rather than conversation memory. It SHALL checkpoint at each phase boundary and whenever execution stops for a blocker or interruption; individual included subtasks SHALL NOT require user-facing checkpoints.

#### Scenario: Task initialization creates durable state

- **WHEN** the user activates the Skill for a new named task with a resolved workspace
- **THEN** the agent creates the task's `PLAN.md` and `LOG.md` before changing the target
- **AND** the initial plan and first-phase preview remain unapproved until the user explicitly continues

#### Scenario: Resume reconstructs current state

- **WHEN** the user explicitly resumes a task in a later session
- **THEN** the agent reads the current plan and relevant log entries before deciding whether to act
- **AND** it reconciles uncertain real-world state before retrying an interrupted phase
- **AND** it reports unresolved decisions and verified progress

### Requirement: Shared behavior is portable across Codex and Hermes

The Skill SHALL keep the durable-task workflow in shared instructions and templates, with separate Codex and Hermes adapters for invocation and agent-specific behavior. Codex plugin metadata SHALL disable implicit invocation. Installing the CthuCodex plugin SHALL NOT be represented as installing the Skill into Hermes.

#### Scenario: Codex plugin invocation uses explicit metadata

- **WHEN** CthuCodex exposes the Skill to Codex
- **THEN** its `agents/openai.yaml` disables implicit invocation and documents the qualified plugin invocation

#### Scenario: Hermes uses the same workflow after separate installation

- **WHEN** the shared Skill is installed in a supported Hermes Skill location and explicitly invoked there
- **THEN** its Hermes adapter supplies the invocation mapping without changing plan, phase, or checkpoint semantics
- **AND** a Codex-only plugin installation is not claimed as Hermes availability

## REMOVED Requirements

### Requirement: Target mutations are approved one step at a time

**Reason**: Requiring a separate confirmation for each logical subtask makes long-running work unnecessarily fragmented.

**Migration**: Replace step proposals and step approvals with the phase review and continuation protocol below; preserve durable state and verification.

## ADDED Requirements

### Requirement: Task phases are reviewed and completed one at a time

The Skill SHALL present one bounded phase before execution, including its goal, included work, exact target and exclusions, expected result, verification, and risk/rollback. A user `继续` SHALL approve only the unchanged phase preview awaiting approval. The first `继续` MAY approve the coherent plan and its fully previewed first phase together. After approval, the agent SHALL execute the included work without per-subtask confirmation, verify the phase, checkpoint durable state, and report the phase result summary before the next-phase plan summary. It SHALL wait for another `继续` before starting the next phase. It SHALL pause within an approved phase only when a user decision is required, the proposed scope or risk materially changes, or an external action was not included in the approved phase.

#### Scenario: First continuation approves the plan and first phase

- **WHEN** a coherent plan and the complete first-phase preview are awaiting approval and the user replies `继续`
- **THEN** the agent records approval of both and starts that phase within its reviewed scope
- **AND** it does not require a separate step-level confirmation

#### Scenario: Included subtasks run within the approved phase

- **WHEN** the user approves a phase containing several related, bounded subtasks
- **THEN** the agent performs the included subtasks and their checks without stopping for routine confirmations
- **AND** it does not perform an unreviewed target mutation or external action

#### Scenario: Phase result precedes the next plan

- **WHEN** the approved phase has completed and been verified
- **THEN** the agent updates `PLAN.md` and `LOG.md`, reports the result and evidence first, and then previews one next phase
- **AND** the next phase waits for `继续`; the reply authorizes only that unchanged preview

#### Scenario: User decision blocks a phase

- **WHEN** an unexpected conflict or ambiguous choice requires user input during a phase
- **THEN** the agent stops the affected work, records the actual state and question, and asks for that decision
- **AND** a plain `继续` does not choose among unresolved options
- **AND** after a clear answer it may resume work already covered by the approved phase

#### Scenario: Changed scope stops execution

- **WHEN** the target, required action, or risk materially differs from the approved phase
- **THEN** the agent stops, records the discrepancy, and presents a revised phase for confirmation
- **AND** the previous approval does not authorize the changed work

#### Scenario: Final verification completes an approved phase

- **WHEN** all planned work is in its last approved phase
- **THEN** the agent performs its planned final Definition-of-Done checks without another step-level confirmation
- **AND** it reports residual, deferred, and unknown items before marking the task complete
