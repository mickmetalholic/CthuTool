## 1. GitHub-only third-party source model

- [x] 1.1 Remove local-path variants from the skill source parser and keep GitHub shorthand, repository URL, and tree URL normalization with clear rejection messages for local, GitLab, and arbitrary Git sources.
- [x] 1.2 Remove `ManagedLocalSkill` from the manifest model and validator, make version 2 entries GitHub-only, and fail clearly on existing unsupported local entries without silently migrating them.
- [x] 1.3 Remove local-source resolution from the npx backend, manager states/actions, command prompts, plan descriptions, and execution paths.
- [x] 1.4 Remove the local ownership sidecar module and all lifecycle/manifest code and tests that existed only to protect repository-local installs.

## 2. Keep `chc codex skills` third-party-only

- [x] 2.1 Remove bridge/local promotion inventory, promotion modes, worktree orchestration, and local cleanup from `chc codex skills`.
- [x] 2.2 Update CLI help, prompts, JSON output, documentation, and tests so the command manages only supported GitHub third-party skills and points local development requests to `codex-skill-promoter`.
- [x] 2.3 Preserve the read-only JSON and non-interactive safety contracts after the promotion flow is removed.

## 3. Add the repository-owned promoter skill

- [x] 3.1 Update `codex-skill-promoter` as the single user-facing workflow that performs read-only discovery after invocation, then requires the user to choose the promotion set and exact post-verification cleanup targets before any write.
- [x] 3.2 Update `agents/openai.yaml` and focused references to document Codex ownership, Hermes evolution provenance, bridge provenance, safe-tree checks, portable repository metadata, shared Codex/Hermes compatibility, and guarded Hermes cleanup.
- [x] 3.3 Implement both classification paths during read-only discovery, then present every eligible candidate with Promote/Skip and independent cleanup-target choices; require every cleanup target to belong to a promoted candidate and expose the Hermes source and adapted Codex staging path separately.
- [x] 3.4 Merge the Hermes absorber contract into `codex-skill-promoter` and remove the standalone `hermes-skill-absorber` repository skill and documentation references.

## 4. User-managed checkout development workflow

- [x] 4.1 Document and test detection of the current clean user-selected checkout, feature branch, repository identity, and HEAD; require the user to create or switch checkout/branch and never do so automatically.
- [x] 4.2 Document and test source fingerprinting, atomic copy into the current checkout's `cthu-codex` plugin, collision resolution, provenance rewriting, compatibility validation, required-file validation, and symlink safety.
- [x] 4.3 Document the post-proposal invocation of `chc codex install --repo-root <current-checkout>` and verify that the promoted skill is present in the installed plugin/cache.
- [x] 4.4 Document guarded cleanup for the user-selected cleanup targets: recheck containment, fingerprint, and Hermes Evolution eligibility after successful verification, obtain final exact-path deletion confirmation, remove only selected unchanged sources, and retain sources on failure.
- [x] 4.5 Ensure the promoter leaves current-checkout changes for review/commit/PR and never creates or switches a branch/worktree, commits, pushes, or removes a checkout automatically.

## 5. Plugin assets and generated outputs

- [x] 5.1 Update the CthuCodex plugin metadata/README to describe scan-then-select promotion and path-specific cleanup targets, guarded Hermes deletion, user-managed checkout, and shared Codex/Hermes compatibility without adding the skill to the third-party manifest.
- [x] 5.2 Regenerate the tracked CLI bundle through the repository build/check process; do not hand-edit generated agent adapter directories.

## 6. Verification and specification alignment

- [x] 6.1 Add or update unit/integration coverage for GitHub-only source handling, local-source rejection, read-only discovery followed by explicit promotion and path-specific cleanup selection, unified Codex/Hermes classification and compatibility, absence of the standalone absorber, user-managed checkout detection, target collisions, install/verification failure, guarded Codex/Hermes cleanup, fingerprint mismatch, and JSON read-only behavior.
- [x] 6.2 Run the CLI unit/integration test suite, lint, TypeScript checking, bundle build, and distribution consistency checks.
- [x] 6.3 Run `openspec validate --specs --strict --no-interactive` and `git diff --check`, then review the final diff to confirm only this change and its generated bundle are included.
