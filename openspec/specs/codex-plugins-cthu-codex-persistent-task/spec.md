# codex-plugins-cthu-codex-persistent-task Specification

## Purpose
Define the CthuCodex persistent-task Skill's explicit activation, durable task-state protocol, human approval boundaries, and portable behavior for Codex and Hermes.

## Requirements

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

For an activated task, the Skill SHALL keep a current `PLAN.md` and append-only `LOG.md` under the target workspace's `.agent/tasks/<task-id>/` directory. It SHALL record the goal, scope, completion criteria, authorization and its source, conditional policies, phase and decision dependencies, execution results, verification, recovery, blockers, and residual issues so a later session can resume from files rather than conversation memory. It SHALL checkpoint at meaningful milestones, phase boundaries, plan changes, decisions, and interruptions without making a checkpoint a request for approval.

#### Scenario: Task initialization creates durable state

- **WHEN** the user activates the Skill for a new named task with a resolved workspace
- **THEN** the agent creates the task's `PLAN.md` and `LOG.md` before changing the target
- **AND** it records existing explicit authorization or keeps uncovered target mutations pending until a concrete execution scope is approved

#### Scenario: Resume reconstructs current state

- **WHEN** the user explicitly resumes a task in a later session
- **THEN** the agent reads the current plan, authorization evidence, and relevant log entries before deciding whether to act
- **AND** it reconciles uncertain real-world state before retrying interrupted work
- **AND** it reports unresolved decisions and verified progress and continues safe remaining work already covered by authorization

#### Scenario: Legacy phase approval remains bounded

- **WHEN** an older plan records approval of only one phase
- **THEN** the agent reconciles actual state and may finish only the work covered by that approval
- **AND** it does not treat a top-level plan approval flag or the new workflow as authorization for later unapproved mutations

### Requirement: Shared behavior is portable across Codex and Hermes

The Skill SHALL keep the durable-task workflow in shared instructions and templates, with separate Codex and Hermes adapters for invocation and agent-specific behavior. Codex plugin metadata SHALL disable implicit invocation. Installing the CthuCodex plugin SHALL NOT be represented as installing the Skill into Hermes.

#### Scenario: Codex plugin invocation uses explicit metadata

- **WHEN** CthuCodex exposes the Skill to Codex
- **THEN** its `agents/openai.yaml` disables implicit invocation and documents the qualified plugin invocation

#### Scenario: Hermes uses the same workflow after separate installation

- **WHEN** the shared Skill is installed in a supported Hermes Skill location and explicitly invoked there
- **THEN** its Hermes adapter supplies the invocation mapping without changing plan, phase, or checkpoint semantics
- **AND** a Codex-only plugin installation is not claimed as Hermes availability

### Requirement: Authorized task execution continues until completion or a genuine blocker

The Skill SHALL establish and record a concrete execution scope covering targets, actions, exclusions, material impact limits, recovery, conditional policies, and observable completion criteria. It SHALL reuse explicit authorization that already covers that scope; otherwise it SHALL present the scope and request one confirmation before uncovered mutations. Within authorized bounds it SHALL continue implementation, reasonable corrections, recovery, and verification without routine step, milestone, or phase confirmations. It SHALL suspend work that requires an unresolved user decision, material scope or risk expansion, unapproved external action, missing external permission or prerequisite, or an explicit user pause. It SHALL continue safe independent authorized work before ending the turn with remaining blockers.

#### Scenario: First continuation approves the plan and first phase

- **WHEN** a coherent plan and its complete execution preview lack authorization and the user replies `继续`
- **THEN** the agent records approval of the unchanged preview and executes its covered work through verification
- **AND** it does not require another confirmation for included steps, milestones, or final checks

#### Scenario: Included subtasks run within the approved phase

- **WHEN** the user authorizes a complete phase containing related work and checks
- **THEN** the agent performs that work, necessary in-scope corrections, and verification without routine confirmations
- **AND** it does not perform target mutations or external actions outside the recorded authorization

#### Scenario: Phase result precedes the next plan

- **WHEN** a phase has completed and been verified
- **THEN** the agent checkpoints durable state and reports its result and evidence before any next-work summary
- **AND** it continues any already authorized next work without asking for `继续` solely because a phase ended
- **AND** it requests input only for a genuinely unresolved decision or missing authorization

#### Scenario: User decision blocks a phase

- **WHEN** an unexpected conflict or ambiguous choice requires user input during execution
- **THEN** the agent preserves the affected targets, records the actual state and question, and suspends dependent work
- **AND** it continues safe independent authorized work that cannot constrain the unresolved choice or compound uncertain state
- **AND** a plain `继续` does not choose among unresolved options
- **AND** a clear answer permits remaining covered work to resume without redundant confirmation

#### Scenario: Changed scope stops execution

- **WHEN** required targets, actions, or material impact exceed recorded authorization
- **THEN** the agent stops the affected work and presents the concrete change, evidence, consequences, and recommendation for a user decision
- **AND** it does not treat previous approval as authorization for the expansion
- **AND** an explicit answer that authorizes the described change is recorded and does not require a second identical confirmation

#### Scenario: Final verification completes an approved phase

- **WHEN** implementation is ready for its required final checks
- **THEN** the agent performs those checks within the authorized execution phase without creating a separate approval gate
- **AND** it reports residual, deferred, and unknown items and marks completion only when required criteria pass

#### Scenario: Existing explicit authorization is reused

- **WHEN** the user's instructions already explicitly authorize a concrete task and its execution bounds are clear
- **THEN** the agent records the authorization source and proceeds without asking the user to approve the same scope again
- **AND** a broad goal alone does not authorize unspecified high-impact targets or external actions

#### Scenario: Routine implementation details adapt within scope

- **WHEN** implementation requires different commands or internal steps while preserving authorized targets, outcomes, exclusions, and impact limits
- **THEN** the agent updates the plan as needed and continues without seeking renewed approval

#### Scenario: Recoverable verification failure is addressed

- **WHEN** a check fails and a reasonable correction remains within authorized bounds
- **THEN** the agent inspects actual state, attempts a safe correction, and verifies again before declaring a blocker
- **AND** it records failed attempts and partial state without blindly repeating mutations or retrying indefinitely
- **AND** required failed or unknown checks remain incomplete

#### Scenario: No safe runnable work remains

- **WHEN** remaining required work depends on unresolved user input or an unavailable external prerequisite and no safe independent authorized work remains
- **THEN** the agent checkpoints the partial result and reports the exact decision or prerequisite needed
- **AND** it does not claim completion or repeatedly retry the unavailable action

### Requirement: Execution phases follow upfront clarification and decision dependencies

The Skill SHALL inspect available facts read-only and resolve material user choices before forming execution phases. It SHALL prefer one complete phase that delivers a verifiable outcome including preflight, implementation, corrections, recovery, and final checks. It SHALL split phases only when a necessary user decision depends on evidence available only after execution and cannot be resolved by prior investigation or an agreed conditional policy. Each such boundary SHALL identify the evidence, dependent decision, and why that decision cannot be settled upfront. Routine steps, tool changes, batch sizes, and checkpoints SHALL NOT independently justify phase boundaries.

#### Scenario: Discovery precedes an execution preview

- **WHEN** target facts or reviewable high-impact mappings can be obtained through available read-only investigation
- **THEN** the agent obtains them without requesting a routine phase confirmation
- **AND** it asks the user only for material decisions that cannot be established from available evidence

#### Scenario: One phase delivers a complete outcome

- **WHEN** the target, material choices, execution bounds, and completion criteria can be established upfront
- **THEN** the agent plans one complete execution phase covering implementation, corrections, and verification
- **AND** it does not impose a fixed phase count or separate inventory, implementation, and final checks merely by operation type

#### Scenario: Conditional policy avoids an unnecessary split

- **WHEN** an expected branch can be covered by an explicit upfront policy such as preserving conflicts and processing the remaining mapped files
- **THEN** the agent records that policy and handles matching cases within the same complete phase without another confirmation

#### Scenario: Execution evidence justifies a phase boundary

- **WHEN** a necessary user choice depends on evidence that only prior execution can produce and no acceptable upfront conditional policy resolves it
- **THEN** the agent defines an earlier phase that produces decision-ready evidence and records the dependent choice and boundary rationale
- **AND** it requests the choice with concrete options, consequences, and a recommendation before dependent work
