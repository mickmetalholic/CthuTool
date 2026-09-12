## Context

The current promoter mixes local-source discovery with checkout validation. It adapts Hermes Evolution sources into Codex staging, then expects a user-prepared clean feature checkout, a separate repository approval, optional source cleanup, and manual Git publication. The plugin's source is under `codex/plugins/cthu-codex`; generated OpenSpec agent adapters are not authored policy.

## Goals / Non-Goals

**Goals:** make discovery independent of Git state; give one complete, reviewable selection; preserve required behavior in both agents; retire only a verified, unchanged original; finish a scoped OpenSpec change and PR without routine pauses.

**Non-Goals:** change third-party `chc codex skills` lifecycle, synchronize Hermes and Codex directories continuously, auto-merge a PR, or delete protected/unprovenanced Hermes Skills.

## Decisions

### Separate discovery from Git publication

The promoter reads the Codex/Hermes ownership inventories and candidate trees before resolving a repository checkout. Git branch, HEAD, and dirty-state checks are removed from this phase. After selection, it locates the intended CthuTool repository and creates an isolated task worktree/branch from the default branch. It never stashes, resets, or stages the caller's unrelated changes. A branch and scoped staging check are needed for a PR, but are implementation safeguards rather than prerequisites for scanning.

### One confirmation covers the complete selected run

The candidate table includes each name, exact source, provenance, file summary, compatibility assessment, target and collision choice, original-retirement path, and the planned OpenSpec-to-PR outcome. Skip remains the default. The user's explicit selection authorizes proposal creation, adaptation, repository write, installation, verified retirement, archive, and PR for those rows. Later prompts are reserved for newly discovered scope, unresolved collision, failed authorization, or safety changes; silence never resolves those blockers.

### Compatibility includes an available Hermes entry point

The shared Skill keeps agent-neutral behavior in `SKILL.md`, references, and scripts. Codex discovery and qualified invocation belong in `agents/openai.yaml` and `references/codex-adapter.md`; Hermes invocation and tool/path mappings belong in `references/hermes-adapter.md`. Check syntax and references with trusted validators, then verify the actual registered invocation in both agents. A CthuCodex cache entry is not a Hermes installation. If Hermes lacks the Skill, expose a compatible copy in a supported Hermes Skill location and verify it. For an existing Hermes Skill, preserve an alternative working invocation before retiring the original; if identity collisions or unavailable Hermes tooling prevent that, keep the original and stop rather than claim completion.

### Retirement is part of promotion, not an optional follow-up

After the plugin and Hermes replacements pass, recheck the original's exact path, ownership/provenance, non-symlink containment, file list, and fingerprint. Remove only that confirmed active source. If permanent deletion is rejected but a reversible move outside all active Skill roots is available, use an explicitly reported retirement path; otherwise leave it intact and stop before archive/PR. Never treat successful command exit alone as verification. This makes the chosen row's original removal predictable while preserving data when preconditions fail.

### OpenSpec and Git remain task-scoped

For the selected set, create one area-named OpenSpec change in the isolated checkout. Complete proposal, delta specs, design when needed, and tasks before editing plugin source. Apply and verify only the selected Skills, install the selected checkout, retire originals, then archive only that change and open one reviewable PR. Stage from an exact path allowlist, inspect the staged diff, and leave unrelated branches, neighboring OpenSpec changes, and generated adapters untouched. The initial confirmation includes PR publication; an authentication or policy rejection is reported with the local branch preserved.

## Risks / Trade-offs

- [Hermes identity collision] → Require a non-conflicting replacement invocation before removing an active Hermes source; stop if that cannot be proven.
- [Stale source after review] → Recompute fingerprints and ownership immediately before every copy and retirement.
- [Dirty caller checkout] → Perform implementation in an isolated task worktree and stage only confirmed paths.
- [Archive expands the diff] → Inspect changed main-spec paths and the final staged file list before committing.
- [Filesystem or host rejects deletion] → Prefer a verified reversible retirement path; otherwise preserve the original and report the blocker.
- [PR or installer unavailable] → Preserve the verified local branch and original source as appropriate, report the failed stage, and do not mark the run complete.

## Migration Plan

Update the promoter Skill, its reference contract and UI prompt, affected docs and tests, then validate the OpenSpec change and the Skill. Archive only this change after verification and publish its task branch as a draft PR. Existing local Skills are not migrated by changing the promoter; a later user-selected run handles each candidate.
