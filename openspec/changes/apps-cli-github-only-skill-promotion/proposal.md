## Why

The Codex skills manager currently treats repository-local directories as a
third-party source, which makes the checked-in manifest depend on checkout
layout and requires machine-local ownership state. That source is no longer
needed. A skill that is authored locally or absorbed from Hermes still needs a
development workflow, but that workflow belongs in a repository-owned Codex
skill rather than in the `chc` CLI command.

## What Changes

- **BREAKING** Remove repository-local path input from `chc codex skills` and
  stop accepting or writing local-source entries in
  `codex/skills.manifest.json`.
- Keep GitHub shorthand, full GitHub repository URLs, and GitHub tree URLs as
  the supported third-party sources, with GitHub-only lifecycle and update
  behavior.
- Remove local-source ownership records and lifecycle states that exist only
  to protect repository-local installs.
- Keep Hermes read-only through discovery, adaptation, repository promotion,
  installation, and verification. The unified repository skill writes a
  confirmed adapted result only to Codex user staging
  (`$CODEX_HOME/skills`) before it can be promoted; an eligible unchanged
  Hermes source may be deleted only in the final, separately confirmed
  cleanup phase.
- Keep `chc codex skills` limited to GitHub-backed third-party skill
  discovery, installation, update, removal, and manifest reconciliation.
- Add one repository-owned `codex-skill-promoter` skill to CthuCodex. It reads
  both the local Codex skill tree and eligible evolution-created Hermes
  skills, adapts a selected Hermes source into reviewed Codex user staging,
  and drives the common development workflow for explicitly selected
  non-third-party skills.
- After read-only discovery, show every eligible candidate and require the
  user to choose both the promotion set and the exact post-verification
  cleanup targets. Default every candidate to Skip and every local copy to
  Keep. A Codex candidate exposes its Codex source as a cleanup target; a
  Hermes candidate exposes its original Hermes source and future adapted
  Codex staging source independently. Cleanup targets may belong only to
  promoted candidates.
- Remove the standalone `hermes-skill-absorber` repository skill after its
  provenance checks, adaptation rules, pre-cleanup Hermes read-only guarantees,
  and guarded cleanup rules are incorporated into `codex-skill-promoter`.
- Make the user own checkout and branch creation. The repository skill detects
  and validates the current clean feature checkout, shows a proposal, and
  copies only after review into
  `codex/plugins/cthu-codex/skills/<name>` in that checkout.
- Require promoted skill content to retain a portable shared core compatible
  with both Codex and Hermes. Keep agent-specific metadata or instructions in
  explicit adapters and block promotion when required semantics cannot be
  represented safely for both agents.
- Have the repository skill invoke the existing `chc codex install` command
  against the current checkout for installation and verification. Only after a
  successful verification and final cleanup confirmation may it remove an
  exact unchanged Codex-user-local source or still-eligible Hermes Evolution
  source selected in the cleanup target set.
- Treat the user-selected checkout as the synchronization boundary: the skill
  never creates or switches branches/worktrees, and it never commits or pushes
  implicitly.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-skill-promoter`: repository-owned development skill
  for absorbing eligible Hermes evolution skills into Codex staging and
  proposing selected local Codex skills into the CthuCodex plugin through an
  explicit post-scan promotion/cleanup selection, a validated user-managed
  checkout, shared-agent compatibility validation, installation verification,
  and guarded cleanup.

### Modified Capabilities

- `apps-cli-codex-skill-management`: restrict third-party source management to
  GitHub and remove local promotion from the CLI.
- `apps-cli-cross-agent-skill-absorption`: keep absorption in Codex user scope
  as the first stage of the unified repository-owned promoter workflow.

## Impact

- Changes the CLI source parser, manifest validator, backend contract, manager
  inventory, command prompts, tests, documentation, and committed bundle.
- Removes the local-source ownership sidecar and its related state handling.
- Adds a repository plugin skill that performs filesystem discovery,
  provenance classification, checkout validation, cross-agent compatibility
  review, installation verification, and guarded local cleanup.
- Existing repository-local manifest entries become unsupported and must be
  removed or migrated to a supported GitHub entry. Locally authored or
  Hermes-absorbed skills use the repository-owned development skill instead of
  the third-party manifest.
