## 1. Source Context and Selection

- [x] 1.1 Extract an injectable runtime package-root resolver and a shared installation source context used by both `status` and `update`.
- [x] 1.2 Implement install-directory, repository, and ref precedence across CLI overrides, environment overrides, actual checkout origin and identity, and absent-checkout defaults.
- [x] 1.3 Detect symbolic branches, deterministic exact tags, and detached commits without silently falling back to `main`.
- [x] 1.4 Add unit coverage for default managed, local-linked, fork origin, pinned tag, detached commit, absent checkout, and explicit directory selection.

## 2. Source-Aware Update Behavior

- [x] 2.1 Add the `local_linked_source` blocked plan kind before any remote command when no install-directory override authorizes another checkout.
- [x] 2.2 Render actionable human and JSON local-development guidance with the actual source path and remote restore command.
- [x] 2.3 Preserve explicit `--install-dir` and `CHC_INSTALL_DIR` update and relink behavior outside the default managed checkout.
- [x] 2.4 Add command-level tests proving default local `update` and `update --check` do not fetch, mutate either checkout, invoke npm, or change the global source link.
- [x] 2.5 Add default-entrypoint tests that exercise runtime source detection without injecting all three source overrides.

## 3. Deterministic and Safe Managed Apply

- [x] 3.1 Verify the fetched target commit contains `apps/cli/dist/index.js` through Git object inspection before checkout mutation.
- [x] 3.2 Record one full target commit in the plan and apply that exact commit for branch, tag, and raw commit targets instead of an unconstrained later pull.
- [x] 3.3 Recheck worktree cleanliness and post-checkout bundle presence while preserving existing dirty and diverged checkout protections.
- [x] 3.4 Add unit and integration coverage for missing target bundles, remote advancement between plan and apply, exact-target results, and no-op updates.

## 4. Output and Diagnostic Credential Safety

- [x] 4.1 Centralize repository URL userinfo redaction for plan and result fields, command arguments, captured stdout and stderr, and update error causes.
- [x] 4.2 Sanitize update failure diagnostic details and verbose output without removing bounded host, repository path, phase, and recovery context.
- [x] 4.3 Add success and failure tests proving authenticated repository credentials never appear in human output, JSON output, verbose events, or diagnostics.

## 5. Remote Installer Safety Alignment

- [x] 5.1 Update the remote installer to reject tracked or untracked changes before changing `origin` or checkout state.
- [x] 5.2 Resolve the configured remote target, block non-fast-forward branch movement, validate its committed bundle, and apply the resolved commit without reset, rebase, stash, or clean.
- [x] 5.3 Extend installer contract fixtures and tests for clean updates, dirty and diverged blocks, invalid bundles, exact target application, and unchanged local mode.

## 6. Documentation and Release Artifact

- [x] 6.1 Update the root README, CLI README, and docs-site CLI guide to distinguish managed self-update, manual local development updates, explicit custom targets, and remote restore behavior.
- [x] 6.2 Refresh `apps/cli/dist/index.js` from the updated CLI source and verify the committed bundle matches source.

## 7. Verification

- [x] 7.1 Run targeted ESLint for changed CLI TypeScript files, the CLI TypeScript type check, and `git diff --check`.
- [x] 7.2 Run focused self-update unit, output, integration, global-bin, diagnostics, and installer contract tests.
- [x] 7.3 Run the repository's CLI bundle freshness verification and confirm generated `.claude/`, `.codex/`, and `.cursor/` adapter files remain unchanged.
- [x] 7.4 Run OpenSpec validation for `apps-cli-align-update-source-lifecycle` and review the final diff for scope and requirement coverage.
