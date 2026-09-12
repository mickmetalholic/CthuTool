## Why

`codex-skill-promoter` currently stops before discovery when the caller's checkout is detached or dirty, asks for repeated decisions, and leaves promoted local copies and Git publication to later manual work. The requested flow is one reviewed selection followed by a complete, scoped promotion that remains usable in both Codex and Hermes.

## What Changes

- Remove current-checkout and branch-state prerequisites from read-only discovery. Show eligible candidates in a clear table with source, ownership evidence, files, compatibility, target, and exact source-removal path.
- Treat the user's promotion confirmation as authorization for one selected end-to-end run: propose an OpenSpec change, apply it, verify Codex and Hermes compatibility and availability, install the plugin, retire the unchanged original local Skill after successful replacement verification, archive the change, and open a pull request. Do not pause at routine intermediate checkpoints.
- Use an isolated task branch or worktree and stage only the selected change's files for Git publication, without modifying or including unrelated checkout changes.
- Preserve eligibility, provenance, fingerprint, symlink, and collision checks. If a replacement cannot be verified in both agents, keep the original and stop with an explicit finding; never delete an active Hermes Skill without a verified Hermes-accessible replacement.
- Keep `chc codex skills` limited to GitHub-backed third-party Skills and keep generated OpenSpec adapters out of the repository.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `codex-plugins-cthu-codex-skill-promoter`: Replace Git-state gating and multi-stage approval with tabular selection and a scoped OpenSpec-to-PR promotion lifecycle with verified source retirement.
- `apps-cli-cross-agent-skill-absorption`: Require a verified Hermes-accessible replacement before an eligible Hermes source is retired, while retaining Evolution provenance and one-way safety boundaries.

## Impact

- CthuCodex `codex-skill-promoter` instructions, promotion contract, invocation metadata, and user documentation.
- Existing promoter contract tests and the two affected OpenSpec capabilities.
- No new `chc codex skills` source type, generated adapter tree, or unrelated plugin change.
