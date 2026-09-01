## 1. Source model and manifest

- [x] 1.1 Add a source parser that recognizes GitHub shorthand, full GitHub repository URLs, direct GitHub tree URLs, and repository-relative local directories, while rejecting GitLab and arbitrary Git URLs before backend invocation.
- [x] 1.2 Normalize GitHub inputs into canonical repository/ref/selector metadata and normalize accepted local paths into safe POSIX paths relative to the selected repository root.
- [x] 1.3 Extend the version 2 manifest types and validator with the discriminated local-source entry, preserving validation and deterministic ordering for existing GitHub entries.
- [x] 1.4 Add manifest fixtures and unit coverage for valid GitHub forms, valid in-repository local paths, path traversal/out-of-root paths, unsupported URLs, and legacy entries.

## 2. Pinned skills backend

- [x] 2.1 Extend the backend source contract so discovery and validation can receive normalized GitHub or local source locators without assuming every entry has a repository/ref pair.
- [x] 2.2 Implement source-specific `npx skills@1.5.19` discovery, validation, install, and update arguments, including direct tree subpaths and local absolute paths, while keeping global Codex scope fixed.
- [x] 2.3 Preserve GitHub lock provenance and update hashing, separate repository local-source intent from machine-local ownership when global lock metadata is absent, and exclude local entries from remote update checks.
- [x] 2.4 Add backend contract fixtures asserting exact arguments and fail-closed behavior for all supported source forms and rejected source classifications.
- [x] 2.5 Persist and validate an atomic machine-local local-source ownership record after successful installation, including source path, selector, target, source fingerprint, and installed-target fingerprint.

## 3. Inventory and reviewed Add workflow

- [x] 3.1 Update the Add prompt and plan construction to accept normalized supported sources, prefill a GitHub tree ref without silently choosing branch versus pin, and skip tracking prompts for local sources.
- [x] 3.2 Add local-source inventory classification for installed, missing, source-missing, source-changed, and known collision states without auto-adopting unrelated local skills.
- [x] 3.3 Update valid action cycling, plan rendering, JSON inventory, and execution so local plans show their repository-relative path and warning, and manifest writes occur only after successful installation.
- [x] 3.4 Add clear no-mutation errors for GitLab and arbitrary Git URLs and preserve cancellation, default-negative confirmation, partial failure, and non-interactive read-only behavior.
- [x] 3.5 Gate local Update/Reinstall and Remove on matching source/selector/target ownership and installed-target fingerprint, classify missing or mismatched records as non-mutating collisions, and allow a reviewed reinstall when only the current source fingerprint changed.

## 4. Verification and documentation

- [x] 4.1 Add manager unit tests for source-specific state transitions, local ownership, missing-source handling, collision handling, and rollback/partial-success behavior.
- [x] 4.2 Add CLI integration tests covering all four supported input forms, local path normalization, unsupported-source rejection, JSON read-only output, and unchanged manifest state after cancellation or rejection.
- [x] 4.3 Update CLI reference documentation and relevant help/output text to document supported GitHub forms, repository-relative local paths, local-source limitations, and explicit GitLab/generic-Git exclusion.
- [x] 4.4 Refresh the committed CLI bundle and verify source/bundle consistency.
- [x] 4.5 Run focused Biome checks, the CLI TypeScript type check, affected unit/integration tests, `git diff --check`, and strict OpenSpec validation; confirm generated `.claude/`, `.codex/`, and `.cursor/` adapters remain unchanged.
