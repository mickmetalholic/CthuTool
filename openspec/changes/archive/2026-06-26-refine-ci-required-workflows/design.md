## Context

The repository now has broad root CI plus scoped checks for CLI distribution, backend images, and desktop artifacts. The scoped checks need to remain inexpensive when unrelated files change, but they also need stable check names so maintainers can mark them as required without depending on path-filtered workflows that may not appear.

The current workflow file names are partly descriptive (`backend-image.yml`, `desktop-artifacts.yml`) and partly generic (`ci.yml`). The desired layout is area-based file names with explicit workflow display names: `cli.yml`, `backend.yml`, `desktop.yml`, and `ci.yml`.

## Goals / Non-Goals

**Goals:**
- Keep required status checks stable even when scoped inputs are unchanged.
- Move CLI distribution validation into a dedicated `cli.yml` workflow while preserving the `cli-dist` job name.
- Rename backend and desktop workflow files to area names while preserving explicit workflow display names.
- Add pull-request concurrency so superseded workflow runs are cancelled.
- Ensure CLI distribution affected-input detection includes root TypeScript configuration.
- Keep tests covering workflow names, required-safe skip semantics, and affected dependency graph behavior.

**Non-Goals:**
- Do not remove the current duplicate `test` and `coverage` execution in this change.
- Do not change application runtime behavior.
- Do not change GitHub branch protection settings directly; document checks that are safe to require.

## Decisions

1. Use job-internal affected detection for scoped workflows.
   - Decision: `cli-dist`, backend image validation, and desktop packaging jobs SHALL always appear on pull requests, then skip heavy steps with a successful job when affected inputs are unchanged.
   - Rationale: Required GitHub checks are easiest to manage when the job name is stable and the check completes successfully rather than disappearing due to `on.pull_request.paths`.
   - Alternative considered: Keep workflow-level path filters. This avoids runner startup for unrelated changes, but missing checks are harder to make required and require manual path maintenance.

2. Keep affected detection in a repository script.
   - Decision: `scripts/ci/affected-workflow.mjs` SHALL own target definitions and derive recursive workspace dependency paths from package manifests.
   - Rationale: GitHub workflow syntax cannot dynamically derive workspace dependency graphs, while a local script can be unit-tested by contract tests.
   - Alternative considered: Use a third-party changed-files action for each workflow. This is simpler for static paths but does not solve recursive workspace dependency maintenance.

3. Use area-based workflow filenames with explicit display names.
   - Decision: Rename workflow files to `cli.yml`, `backend.yml`, and `desktop.yml`, and use names such as `CLI Distribution`, `Backend Image`, and `Desktop Artifacts`.
   - Rationale: Short area filenames are easier to scan and leave room for each area workflow to grow beyond one job, while display names keep GitHub UI intent clear.

4. Preserve required job names.
   - Decision: Keep required-facing job names such as `cli-dist`, `validate`, and `Package desktop (...)` stable where practical.
   - Rationale: Changing job names forces branch protection updates and makes PR status history harder to compare.

## Risks / Trade-offs

- [Risk] Scoped workflows will start a runner even for unrelated PRs. -> Mitigation: affected detection runs before dependency installation or heavy setup, so unrelated runs exit quickly with success.
- [Risk] Affected detection can miss files if target definitions drift. -> Mitigation: contract tests exercise representative affected and unaffected files for CLI, backend, and desktop targets.
- [Risk] Workflow file renames can temporarily duplicate checks if old files remain. -> Mitigation: implement renames as moves and remove old workflow files in the same change.
- [Risk] GitHub required check settings are external to the repository. -> Mitigation: keep job names stable and document the check names that can be required after merge.
