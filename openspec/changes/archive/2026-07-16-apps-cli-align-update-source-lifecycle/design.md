## Context

The root package is installed globally from a filesystem path, so npm links the global `chc` entrypoint back to the selected repository checkout. The running module can therefore recover its real package root. `chc status` already uses that fact, while the updater independently defaults to the official repository, `main`, and `~/.cthutool/source/CthuTool`.

That split creates two different lifecycle identities. A local-linked command can update and globally install an unrelated managed checkout, while one-shot remote choices such as a fork or tag are lost unless the user repeats environment overrides forever. The managed checkout is also live: checkout mutations affect the next `chc` invocation before bundle verification and global reinstallation finish.

The change must retain the lightweight target requirements of Git, Node.js 24, and npm; preserve the committed bundle model; avoid destructive Git recovery; and keep existing explicit source overrides available.

## Goals / Non-Goals

**Goals:**

- Give status, check, and update one shared understanding of the running installation source.
- Prevent a default update from mutating or replacing an unrelated local-linked checkout.
- Preserve the actual origin and checked-out branch, exact tag, or commit for managed updates unless the user explicitly overrides them.
- Validate the planned target before worktree mutation and apply exactly the commit displayed by preflight.
- Keep dirty and diverged work untouched in both CLI and remote-installer managed flows.
- Prevent repository credentials from appearing in human, JSON, verbose, or diagnostic output.
- Cover default entrypoints rather than testing only explicitly injected update directories.

**Non-Goals:**

- Automatically pull, merge, rebase, reset, stash, or clean a local development checkout.
- Add a persistent installation registry or infer historical installer intent for every custom path.
- Make managed checkout replacement fully transactional across process or filesystem failure.
- Add a background update checker, publish to npm, or change the committed bundle model.
- Change the existing `local` and `remote` status labels in this change.

## Decisions

### Resolve one installation source context

Introduce a shared source-context resolver used by status and update. It identifies the runtime package root, the default managed root, whether the runtime root is the default managed checkout, Git origin and identity when available, and whether an install-directory selection was explicit.

Update selection uses this precedence:

1. Install directory: CLI `--install-dir`, then `CHC_INSTALL_DIR`, then the runtime package root.
2. Repository: CLI `--repo`, then `CHC_REPO_URL` or `CHC_REPO`, then the selected checkout's `origin`, then the official default for an absent checkout.
3. Ref: CLI `--ref`, then `CHC_REF`, then the selected checkout's symbolic branch, exact tag, or current commit, then `main` for an absent checkout.

The runtime package root is preferred over the current working directory because the command can be invoked from anywhere. Reading the actual checkout is preferred over a state file because npm links can be replaced outside the installer and the linked module remains the source of truth.

### Treat local-linked default update as blocked, not automatic Git management

When the runtime source is outside the default managed root and no install-directory override is present, `chc update` and `chc update --check` produce the existing `blocked` plan status with a new `local_linked_source` block kind. They identify the local source, explain that it follows developer-managed files, and direct the user to update and rebuild that checkout or use the documented remote restore command.

The command performs no remote fetch, managed-checkout mutation, checkout, or npm global install in this state. A CLI or environment install-directory override remains an explicit opt-in to the existing advanced update behavior, including relinking the global command to that selected directory after a successful apply.

Automatically updating the local checkout was rejected because local sources can be dirty, detached, on feature branches, or attached to a multi-worktree repository. Silently retaining the managed default was rejected because it caused the reported bug and can change installation mode without consent.

### Preserve installed managed source choices

For the default managed runtime, repository and ref defaults come from the checkout itself. A symbolic branch tracks the matching remote branch; an exact tag remains pinned to that tag; a detached untagged commit remains pinned to that commit. Moving from a pinned ref to `main`, changing repository, or selecting another directory requires an explicit override.

This avoids silently replacing forks and pins. Non-default remote installation directories continue to be reported as `local` under the existing path-based status contract; their users must keep using an explicit install-directory override. A registry that could distinguish those directories was rejected as outside this change.

### Validate and freeze the planned target

Preflight fetches the requested ref, resolves one full target commit, performs branch ancestry checks, and verifies `apps/cli/dist/index.js` exists in that target commit with Git object inspection before checkout. Apply rechecks worktree cleanliness and then advances or detaches the checkout to the recorded commit rather than running an unconstrained `git pull` that can install a newer commit than the plan displayed.

Bundle presence is verified again after checkout as defense in depth. Full staging-directory replacement was rejected for now because it changes checkout ownership, cleanup, and npm-link mechanics substantially; exact-target application plus pre-mutation bundle validation addresses the known failure without introducing a second managed checkout lifecycle.

### Redact at every output boundary

Use one URL-userinfo redaction helper for plan/result repository fields, emitted command arguments, captured stdout and stderr, `SelfUpdateError` causes, verbose rendering, and command diagnostic details. Raw subprocess results may remain available only inside the updater long enough to classify success; they must not cross an output or diagnostics boundary unsanitized.

Redacting only command arguments was rejected because Git commonly repeats a failing URL in stderr. Key-based diagnostics sanitization alone was also rejected because a field named `repo` is not currently considered sensitive.

### Align remote installer safety with updater safety

For an existing managed checkout, the shell installer checks dirty state before changing `origin`, resolves and validates the configured target before checkout, blocks non-fast-forward branch movement, and applies the resolved commit. It continues to clone a missing checkout and never auto-recovers by reset, rebase, stash, or clean.

The shell flow remains separate from the TypeScript updater because the public raw installer must run before `chc` exists and cannot depend on workspace tooling. Contract tests keep the two implementations behaviorally aligned.

### Preserve structured compatibility where possible

The existing plan status union remains unchanged. Local-linked detection uses `status: "blocked"` plus `block.kind: "local_linked_source"`; applying or checking that plan continues through the existing `update_failed` error contract. Successful managed JSON result shapes remain unchanged, with source selection made accurate rather than adding another success state.

This is intentionally breaking for scripts that ran a local-linked `chc update` expecting it to manage the default remote checkout. Those scripts can pass an explicit install directory or use the remote installer restore flow.

## Risks / Trade-offs

- [A local user expected `chc update` to switch back to remote mode] → Block with the exact source path and the existing remote restore command; keep explicit directory overrides.
- [Exact tag detection can find multiple tags at one commit] → Choose a deterministic sorted exact tag for display while preserving the target commit identity.
- [A remote branch advances after preflight] → Install the preflight commit and let the next check report the later commit instead of changing the approved target mid-apply.
- [The managed checkout is still updated in place] → Validate the target bundle before checkout, recheck after checkout, and leave full staged replacement for a separately scoped change.
- [Custom remote directories remain labeled local] → Preserve the documented current contract and require explicit `--install-dir` or `CHC_INSTALL_DIR`; do not introduce stale persistent state.
- [Stronger installer preflight rejects a checkout previously carried through with local edits] → Report recovery guidance and never discard the edits automatically.
- [Redaction can hide part of a legitimate URL] → Redact only URL userinfo and retain host, path, bounded Git context, and phase information.

## Migration Plan

1. Add the shared source context and update-selection tests before routing command behavior through it.
2. Add local-linked blocking, installed repo/ref inference, exact-target planning, bundle object validation, and output redaction.
3. Align the remote installer contract and update documentation for local and managed workflows.
4. Refresh the committed CLI bundle and run focused lint, type, contract, unit, integration, bundle-freshness, and diff checks.
5. Existing local-linked users continue running from their checkout; their next update command explains the manual development workflow instead of touching the managed directory.

Rollback restores the prior bundle and source files. Users who need a managed command during rollback can run `CHC_INSTALL_MODE=remote scripts/install-chc.sh` from a checkout.

## Open Questions

None.
