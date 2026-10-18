## Context

The current Skill describes each phase as an approval unit. `agents/openai.yaml`, `PLAN.md`, interaction templates, examples, and the main specification reinforce a fresh `继续` for every phase. Examples make read-only inventory and final verification separate phases. Failed or unknown checks can become blocked before an in-scope recovery attempt.

The shared Skill is used by Codex and Hermes after their respective installations. This change explicitly targets that business plugin; generated project adapters are unrelated.

## Goals / Non-Goals

**Goals:** Resolve material choices before execution, favor complete and larger phases, preserve explicit authorization, and keep executing until completion or a genuine decision/external dependency prevents remaining work. Retain durable evidence and safeguards against blind replay or ambiguous data changes.

**Non-Goals:** Change invocation or installation, automatically install updated copies, grant broad permission from a vague goal, replace host permissions, introduce a scheduler, or modify other plugin skills.

## Decisions

### Discover and clarify before forming execution phases

Inspect available facts read-only first. Ask the user only for unresolved choices that affect scope, outcomes, constraints, material impact, recovery, or completion. Establish conditional policies when the user can decide them upfront. Do not ask the user to approve routine discovery or facts the agent can obtain.

When an initial broad request does not yet identify concrete high-impact targets, discovery must produce the reviewable mapping or remediation proposal before mutation. Existing explicit authorization may already cover a well-bounded task; record its source instead of asking again.

### Prefer one complete phase and explain any necessary split

A phase should deliver a complete verifiable outcome and include its preflight, implementation, corrections, recovery, and final verification. Routine steps, multiple tools, batch sizes, implementation uncertainty, and documentation checkpoints are internal organization.

Split only when a required user decision depends on evidence available only after execution and cannot be resolved through read-only discovery or an upfront conditional policy. Record the dependency, the evidence the earlier phase will produce, and why the choice cannot be settled now. Do not pre-create a fixed number of phases.

### Authorization survives milestones and checkpoints

Keep a dedicated Authorization section in PLAN: source, approved targets/actions/exclusions, impact and recovery bounds, conditional policies, and any outstanding permission. A plan is an implementation guide within that authorization, not a frozen list of commands. Routine implementation adjustments that preserve those bounds are permitted.

A pending initial or revised preview can be approved with an unambiguous `继续`; an already authorized task does not require another one. Completion of a milestone or phase is not itself a reason to ask. A new decision or material expansion still requires a concrete preview and explicit authorization; answering a decision can supply that authorization when the answer clearly covers the revised action.

### Continue useful work around local blockers and recoverable errors

Preserve conflicting or uncertain targets and suspend their dependents. Continue only independent work that cannot constrain the unresolved choice, compound the failure, or affect shared uncertain state. Distinguish a task that remains in progress from one with no safe runnable work left.

For ordinary failures, inspect actual and partial state, attempt reasonable corrections within the approved bounds, and verify again. Do not blindly replay mutations, retry indefinitely without new evidence, or mark required failed/unknown checks complete. External permissions, missing prerequisites, a necessary user decision, and explicit cancellation remain legitimate stopping conditions.

### Durable state records authority as well as progress

Retain small PLAN and append-only LOG, adding explicit authorization and decision dependencies. Write checkpoints at meaningful milestones, phase results, decisions, plan changes, and interruptions, without turning each into a user gate. Keep original approval and decision evidence available across compaction.

On resume, inspect real state and reconcile completed and remaining actions. Reuse only the recorded authorization that still applies. For a legacy plan whose user approved only P1, do not treat a top-level plan flag as permission for P2; finish P1 if safe and seek any genuinely missing authorization before later mutations.

### Keep every source of behavior consistent

Revise the entrypoint, PLAN/LOG templates, interaction templates, examples/manual checks, README, and Codex interface text together. Preserve explicit-only invocation and leave both invocation adapters untouched.

## Risks / Trade-offs

- [Larger phases hide unresolved choices] -> Discover first, record assumptions and conditional policies, and name any execution-dependent decision that justifies a split.
- [A broad goal is mistaken for permission] -> Persist concrete scope and authorization evidence; high-impact target mappings and unapproved external actions still require review.
- [Local continuation compounds uncertain state] -> Continue only work independent of the unresolved choice and recovery state.
- [An old phase approval expands silently] -> Reconstruct the actual approved scope from legacy files and the log before acting.
- [Instruction validation misses behavioral errors] -> Review representative environment setup, file organization, troubleshooting, blocker/recovery, and legacy-resume scenarios alongside structural validation.

## Migration Plan

Update only the selected Skill sources and capability. Existing task files remain readable; normalize them on explicit resume while retaining original evidence and authority. Validate the Skill, references, metadata, behavioral scenarios, and OpenSpec. Sync this capability, verify the merge, archive this change, and commit the scoped files on the task branch without opening a PR.

## Open Questions

None. The user confirmed upfront clarification, complete execution phases, and splitting only for decisions that require prior execution evidence.
