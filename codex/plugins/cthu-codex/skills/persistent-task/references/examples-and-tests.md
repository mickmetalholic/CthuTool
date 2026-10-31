# Acceptance scenarios

Use these hypothetical cases to review actions, authority, evidence, and stopping points.

## A — Complete development environment

**Request:** Configure a development environment while preserving system Python and existing configuration; back up files before overwriting.

**Expected:** Inspect available OS, tools, versions, and configuration. Resolve version preferences, target configuration, backup policy, and completion criteria upfront. Record or obtain authorization for one phase covering installation, configuration, recovery, and tool/regression checks. Continue through checkpoints and ordinary recoverable failures.

**Check:** A complete environment is verified within the authorized phase. Unexpected version trade-offs or missing permissions suspend affected work while safe independent work continues.

## B — File organization with a conditional policy

**Request:** Organize a large directory while preserving conflicts, damaged files, and ambiguous versions.

**Expected:** Obtain a reviewable source/destination mapping read-only. Confirm exclusions, count/bytes/content checks, conflict policy, and whether preserved cases satisfy DoD. Process approved batches and verify results within one phase. Include cleanup only when its targets and recovery are authorized.

**Check:** Policy-covered conflicts are preserved automatically. Unexpected conflicts suspend dependent work; independent batches continue safely. Required unresolved items remain incomplete unless preservation satisfies the agreed DoD.

## C — Troubleshooting within approved bounds

**Request:** Locate and fix an intermittent service failure.

**Expected:** Inspect baseline, logs, hypotheses, and recovery options. Settle service targets, configuration/restart limits, and completion evidence. Use one phase for diagnosis, covered remediation, recovery, and regression checks. Adapt internal commands within those bounds.

**Check:** A different service or materially higher impact requires a concrete expansion preview and user decision. An explicit answer approving that expansion supplies authorization. Completion requires observed regression evidence.

## D — Execution evidence creates a phase boundary

**Request:** Generate trial conversions, let the user inspect their quality and select a preset, then convert a named collection.

**Expected:** Settle mappings, presets, recovery, and verification upfront. Record why the quality choice requires actual outputs. P1 produces verified trial outputs and a comparison; P2 depends on the user's preset choice.

**Check:** Report P1 evidence before asking for the choice. A reply selecting and authorizing the previewed P2 starts bulk conversion through final checks. Agent-solvable implementation uncertainty stays within a phase.

## E — Recovery and isolated blockers

**Given:** An authorized phase, a failed check with a safe in-scope fix, and a data conflict requiring user judgment.

**Expected:** Inspect partial state, apply a reasonable correction, and verify again. Preserve the conflict and suspend its dependents. Continue work that leaves the choice and shared state safe. Record attempts and retry only with evidence supporting safe correction.

**Check:** Keep `in_progress` while safe work or recovery remains. Set `blocked` when remaining work needs the choice or an external prerequisite. Failed/unknown checks remain incomplete; accepted follow-ups require a passing DoD and explicit user acceptance.

## F — Resume and legacy authority

**Given:** An interrupted task with durable state; an older task may have `Plan Approval: approved` plus P1-only approval.

**Expected:** Read PLAN and LOG, inspect actual state, and distinguish completed and remaining actions. Continue work covered by recorded authorization. Normalize legacy current fields while preserving history and the P1-only scope.

**Check:** Retries follow reconciliation. An unchanged pending preview accepts an unambiguous `继续`; unresolved choices require explicit answers. Request authorization for P2 when it remains uncovered.

## Invocation and lifecycle checks

- Bare invocation shows usage only; status reads state only. Inspection and ordinary complex tasks leave the Skill inactive.
- Read-only discovery supplies available facts before user questions.
- Each additional phase names evidence, a necessary user choice, its dependent work, and why the choice must wait.
- Existing authorization survives checkpoints and context loss; expansions and external destinations require explicit authority.
- A user pause stops the requested work. Completion reporting includes observed verification, changes, recovery, residuals, and deferred decisions.
