## Context

The first `chc codex skills` implementation deliberately treats `codex/skills.manifest.json` as desired state and ignores every local installation absent from that file. This prevents accidental adoption of personal or generated skills, but it also discards useful provenance already recorded by the pinned `skills` backend. In particular, an empty manifest causes the manager to exit before listing locally installed GitHub skills that could be reproduced safely on another machine.

The backend currently combines `skills list --global --agent codex --json` with version 3 lock data from `~/.agents/.skill-lock.json`, but exposes only a skill name, local path, managed flag, and repository. Tracking a local installation requires a richer, validated candidate containing enough source information to construct a version 2 manifest entry. The existing manifest schema already holds the required repository, selector, tracking type/ref, and enabled state, so no schema version change is required.

## Goals / Non-Goals

**Goals:**

- Show the union of manifest entries and eligible locally installed GitHub skills in the management inventory.
- Let Space select an explicit Track action for an eligible `local_only` row.
- Complete and validate reproducible tracking metadata before presenting the execution plan.
- Write confirmed Track selections to the manifest without reinstalling, updating, deleting, or copying the local skill.
- Preserve read-only JSON behavior and provide useful empty-state guidance.

**Non-Goals:**

- Vendoring local skill directories into this repository.
- Importing self-authored, manually copied, well-known, plugin-provided, system, runtime, or provenance-incomplete skills.
- Guessing a GitHub repository from a skill name or `SKILL.md` text.
- Automatically adopting every eligible local skill.
- Adding support for non-GitHub sources or changing the version 2 manifest schema.

## Decisions

### 1. Build one inventory from desired state and eligible local realization state

`buildManagedSkillInventory` will always request installed state, even when the manifest is empty. It will classify manifest entries as today, then append only backend-provided local candidates whose names are absent from the manifest and whose source type and metadata satisfy the pinned GitHub contract. Those rows use a new `local_only` state and expose `none` and `track` actions.

The backend adapter will expose a richer candidate model derived from the installed list and supported lock fields. A candidate must identify a GitHub repository and an unambiguous selector or skill path. A recorded ref can be surfaced as an initial value, but CthuTool will not infer whether an arbitrary ref represents branch tracking or a deliberate pin.

Alternatives considered:

- Continue building only from the manifest and require users to repeat the Add flow. This is safe but hides known local state and is the usability gap this change addresses.
- Enumerate every directory under the Codex skills root. Directory presence alone cannot produce reinstallable desired state and would reintroduce accidental local export.

### 2. Keep adoption explicit and complete metadata before plan review

Space cycles a `local_only` row from `none` to `track`. After Enter, the interaction collects any missing tracking decision, including branch versus pin and the ref, using backend metadata only as a visible default. Before a Track item enters the plan, the adapter validates that the selected GitHub source and selector exist at the chosen ref through the pinned discovery/source contract.

The plan describes Track as a manifest-only operation and shows repository, selector, tracking type, and ref. Confirmation remains default-negative. This keeps local discovery read-only until the user selects, reviews, and confirms a specific adoption.

Alternatives considered:

- Automatically write every backend-managed GitHub skill. This would turn local discovery into implicit repository policy and could capture personal choices.
- Always assume `main` branch tracking. Repositories use different default branches and local installations can be pinned, so this would create unreliable desired state.

### 3. Treat Track as a manifest transaction, not a backend lifecycle operation

A confirmed Track item atomically upserts a validated enabled entry into the version 2 manifest. It does not call backend install/update/remove methods because the local installation is already present and compatible. Failed source validation or manifest writing leaves both local state and the prior manifest unchanged. Multi-item execution reports Track success or failure per skill using the existing partial-result model.

This requires adding `track` to the action and plan types while keeping `add` for the separate GitHub discovery-and-install path. The distinction makes the execution effect reviewable and testable.

### 4. Preserve exclusion boundaries in human and JSON inventory

Read-only JSON output will include eligible `local_only` rows and their Track action alongside manifest-backed rows. Unsupported local entries will not be emitted, counted, or named. This avoids leaking or normalizing unrelated personal state while giving automation an accurate view of what the interactive manager can adopt.

When no manifest rows or eligible local candidates exist, the human UI will state that there are no tracked or trackable GitHub skills and point to Add from GitHub. `No changes selected.` remains reserved for a displayed action table in which the user leaves every row at `none` and presses Enter.

## Risks / Trade-offs

- [Pinned lock metadata changes] → Keep parsing in the backend adapter, cover supported fields with fixtures, and fail closed without listing a Track action when provenance cannot be validated.
- [A stored ref is ambiguous] → Require an explicit branch-versus-pin choice and let the user confirm or replace the suggested ref.
- [Remote validation needs network access] → Leave local and manifest state unchanged, report an actionable error, and allow retry; do not write partially reproducible intent offline.
- [A local skill changed after installation] → Track records upstream desired state, not a backup of local bytes; make the manifest-only effect explicit in the plan and never copy the directory.
- [The unified inventory becomes noisy] → Include only GitHub candidates recognized by the pinned backend and continue excluding unsupported local sources entirely.

## Migration Plan

1. Extend backend installed-skill metadata and contract fixtures to expose validated GitHub tracking candidates while preserving existing manifest reconciliation.
2. Build the union inventory and add `local_only`/`track` state and action modeling.
3. Add tracking-metadata prompts, source validation, plan rendering, and atomic manifest-only execution.
4. Update JSON and empty-state output, documentation, and focused unit/integration tests.
5. Rebuild the committed CLI bundle and run targeted lint, type checks, tests, bundle freshness, and strict OpenSpec validation.

No manifest migration is required. Rollback removes local-only enumeration and Track actions; entries already tracked are valid version 2 entries and remain manageable through the existing workflow.

## Open Questions

None. Unsupported or incomplete local provenance remains excluded until the pinned backend contract can represent it safely.
