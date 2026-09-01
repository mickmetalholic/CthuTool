## Context

The existing `chc codex skills` command owns the third-party skill lifecycle:
it validates GitHub sources, invokes the pinned `npx skills` backend, and
maintains `codex/skills.manifest.json`. That is the right boundary for
third-party state, but it is not the right entry point for developing a skill
that was authored locally or absorbed from Hermes.

CthuCodex is already a repository-owned plugin containing workflow skills.
The development workflow can use one user-facing skill to inspect eligible
Hermes sources and the local Codex tree, use ordinary Git and filesystem
operations for the proposal, and invoke the existing `chc codex install`
command only after a reviewed source exists in a user-selected checkout. The
previous standalone Hermes absorber is merged into this entry point instead of
requiring a manual handoff between two repository skills.

## Goals / Non-Goals

**Goals:**

- Keep `chc codex skills` limited to GitHub-backed third-party reconciliation.
- Add one repository-owned `codex-skill-promoter` skill as the local
  development entry point.
- Discover locally authored Codex skills and eligible evolution-created
  Hermes skills without treating them as npx-managed sources.
- After read-only discovery, require explicit per-candidate promotion and
  exact post-verification cleanup-target choices.
- Adapt a confirmed Hermes source into Codex user staging with portable
  provenance before entering the common promotion workflow.
- Preserve an agent-neutral shared core that remains usable by both Codex and
  Hermes, with agent-specific behavior isolated in explicit adapters.
- Validate the clean feature checkout prepared by the user instead of creating
  or switching a branch/worktree.
- Install and verify that checkout before offering cleanup of any selected
  Codex staging or eligible Hermes source.
- Leave checkout changes for human review, commit, and pull request creation.

**Non-Goals:**

- Adding local paths to `codex/skills.manifest.json` or the npx lifecycle.
- Making the `chc` CLI scan, propose, copy, or delete local authored skills.
- Creating, switching, or deleting Git branches or worktrees for the user.
- Automatically synchronizing Hermes and Codex or adding a reverse Hermes
  lifecycle.
- Editing, merging, updating, or otherwise managing Hermes source content;
  only final deletion of an explicitly selected, unchanged eligible source is
  in scope.
- Automatically committing, pushing, opening a PR, or changing checkout state.

## Decisions

### 1. Put the development entry point in the repository plugin

`codex-skill-promoter` is a normal CthuCodex skill with its own
`agents/openai.yaml` and optional references. Its instructions describe the
workflow and safety checks; they do not become another CLI subcommand. This
keeps the developer workflow close to the plugin source it is modifying and
allows the agent to explain a proposal in context.

The alternative was adding another mode to `chc codex skills`. That would mix
third-party desired state with first-party source development, require the CLI
to own checkout mutation and destructive cleanup, and make the
command's JSON/inventory contract much broader. The CLI remains responsible
only for its existing GitHub/npx lifecycle.

### 2. Classify both source modes, then ask the user what to do

Explicit invocation starts read-only discovery across the Codex and Hermes
roots without following symlinks or executing content:

- Under the Codex user skills root, third-party, manifest, plugin, cache, and
  system-owned skills are excluded. A valid `.cthu-skill-bridge.json` marks an
  already absorbed candidate, while an otherwise unowned valid skill is
  labeled locally authored and requires explicit user selection.
- Under the Hermes user skills root, a candidate must carry a valid dedicated
  `.hermes-evolution.json` marker. Names from `.bundled_manifest`,
  `.hub/lock.json`, protected built-in inventories, external or organization
  roots, explicit opt-outs, and unprovenanced skills are excluded.
- Invalid, ambiguous, symlinked, or out-of-root paths are never proposed.

This provides one entry point without weakening the evidence needed to tell a
user-authored or evolution-created skill from a managed third-party or built-in
skill.

After discovery, the promoter shows every eligible candidate with source mode,
classification, provenance, files, compatibility warnings, and these choices:

- promotion action: Promote or Skip; and
- zero or more exact cleanup targets to remove after verified install.

Promotion defaults to Skip and every cleanup target defaults to Keep. A
Codex-local candidate exposes its direct Codex source. A Hermes candidate
exposes two independent targets: the original eligible Hermes Evolution source
and the future adapted Codex staging tree. A cleanup target is valid only when
its owning candidate is promoted. No staging or repository write occurs until
the user reviews and confirms the complete promotion and cleanup-target plan.

### 3. Adapt Hermes into compatible Codex staging before common promotion

For a selected Hermes source, the promoter previews every frontmatter, tool,
path, file, and dependency adaptation before writing. After a dedicated
confirmation, it writes only regular reviewed files atomically to
`$CODEX_HOME/skills/<name>` and adds `.cthu-skill-bridge.json`. The Hermes
source remains unchanged throughout adaptation, repository promotion,
installation, and verification. The resulting Codex tree becomes the source
for the same checkout promotion used by an already local Codex candidate.

An existing Codex candidate skips this adaptation stage. Collision handling in
Codex staging is explicit merge, replace, or rename; cancellation and unsafe or
incomplete sources leave both roots unchanged. This internal staging boundary
keeps the repository copy reviewable without exposing a separate absorber
skill.

The adapted tree must retain a portable shared core. Its `SKILL.md`, references,
and scripts use agent-neutral capabilities and configurable paths whenever
possible. Codex discovery metadata belongs in `agents/openai.yaml`; unavoidable
Codex mappings belong in `references/codex-adapter.md`, and unavoidable Hermes
mappings belong in `references/hermes-adapter.md`.
The preview reports each compatibility decision and blocks when required
behavior cannot be represented safely for both Codex and Hermes.

### 4. Validate the checkout selected by the user

Before local skill discovery, the promoter resolves the current repository
root, branch, `HEAD`, upstream default branch, and status. It requires the
CthuCodex plugin, a clean
non-detached feature branch, and an explicit confirmation that this is the
checkout the user intends to modify. A default branch or unsuitable checkout
fails closed with guidance for the user to create or switch their own branch
or worktree.

The promoter never runs `git checkout`, `git switch`, `git branch`, or
`git worktree add/remove`. It shows the checkout path, branch, `HEAD`, source
fingerprint, target, compatibility result, and collision resolution before
writing. It rechecks all of them immediately before the atomic copy into
`<current-checkout>/codex/plugins/cthu-codex/skills/<name>`.

### 5. Reuse CLI installation only after proposal creation

The promoter invokes the existing
`chc codex install --repo-root <current-checkout>`
after the plugin source is written. It passes the user's existing Codex home
and cache context, then verifies that every promoted skill is present in the
installed plugin/cache. This preserves the repository plugin install contract
without making `chc codex skills` the workflow entry point.

Only exact paths in the user-selected cleanup target set are considered for
deletion, and only after successful verification and a final confirmation. The
promoter rechecks containment and source fingerprint; installation failure,
verification failure, cancellation, or concurrent source edits retain the
local tree. A selected Codex target must still be a non-symlinked direct child
of the resolved Codex skills root. A selected Hermes target must still be a
non-symlinked direct child of the resolved Hermes skills root, carry the same
valid Evolution marker, remain absent from all managed/protected inventories,
and match the reviewed fingerprint. The two targets of a Hermes-origin flow
are confirmed and deleted independently. No Hermes file is edited, merged, or
updated. The checkout changes remain because they are the Git review and PR
source.

### 6. Preserve provenance without machine-local paths

For Hermes-absorbed sources, the promoter carries the bridge provenance into
the repository copy but rewrites absolute machine paths to portable Hermes
scope identifiers. For locally authored sources, the proposal records the
classification and source fingerprint in the review output; it does not add a
third-party manifest entry. Any metadata written into the plugin must not
contain secrets or machine-specific absolute paths.

### 7. Keep Git as the sharing mechanism

The promoter reports the checkout and branch and leaves the changes
uncommitted. The user reviews and commits the checkout, opens a PR, and other
machines receive the skill through Git before running `chc codex install`.
Neither the promoter nor `chc codex skills` changes checkout state, commits,
or pushes implicitly.

## Risks / Trade-offs

- **An unmarked local skill may not actually be authored by the user** → label
  it explicitly as unowned and require a deliberate selection/confirmation;
  never auto-promote it.
- **A dirty, detached, or default-branch checkout is not a safe write target**
  → fail before repository writes and ask the user to prepare and select a
  clean feature checkout.
- **The source can change during the workflow** → fingerprint before copy and
  before cleanup; keep the source on mismatch.
- **Deleting an original Hermes skill can discard Hermes-specific history or
  files that were adapted during promotion** → default the Hermes cleanup
  target to Keep, show its exact path separately from Codex staging, repeat
  Evolution/ownership/path/fingerprint checks, and require a final explicit
  deletion confirmation after plugin verification.
- **Installation can mutate local Codex configuration or cache before a PR** →
  make install a visible post-proposal step, verify the result, and never
  delete the source on failure.
- **The user can switch checkout state during review** → capture and recheck
  repository root, branch, `HEAD`, status, source fingerprint, and target
  immediately before writing.
- **A promoted skill can become Codex-only and lose Hermes semantics** → keep
  a portable core, isolate agent adapters, report compatibility rewrites, and
  block unresolved required behavior.
- **A unified repository skill can become stale after Hermes or plugin
  changes** → keep both source-mode contracts and their tests versioned with
  the plugin.

## Migration Plan

1. Remove local-source manifest and ownership handling from the CLI while
   retaining a clear failure message for existing local entries.
2. Remove local promotion inventory and worktree orchestration from
   `chc codex skills`.
3. Add `codex-skill-promoter` to the CthuCodex plugin, incorporate the Hermes
   evolution discovery and adaptation contract, and remove the standalone
   `hermes-skill-absorber` repository skill.
4. Keep existing Hermes-absorbed skills in Codex-user staging until the user
   explicitly invokes the repository-owned promoter. No automatic deletion or
   repository write occurs during upgrade.
5. Rollback is safe before cleanup because the user owns the checkout and can
   review or revert its uncommitted plugin changes with normal Git operations.
   The promoter never changes branch/worktree state. Cleanup defaults to Keep;
   an explicitly deleted Hermes source is reported as a completed destructive
   action and is not restored automatically.
