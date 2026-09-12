## Context

See `proposal.md` for the user-facing problem. The update manager already resolves the running source, plans a fixed target commit, verifies a committed bundle, and fast-forwards safely. An early local-mode guard prevents that machinery from running. The local command points directly at its checkout, so updating the checkout does not require replacing the global command link.

## Goals / Non-Goals

**Goals:** Make default local update/check work on the linked checkout, preserve local data, and keep the managed install flow stable.

**Non-Goals:** Automatically stash or rebase changes, switch source modes, or build an uncommitted CLI bundle during update.

## Decisions

### Reuse the existing update planner and exact-commit apply path

Remove the local-only stop and route the linked checkout through existing remote resolution, target-bundle validation, fast-forward checks, and planned-commit merge. This keeps local and managed source selection consistent. A separate `git pull` implementation would bypass the safety and structured-result contracts.

### Preserve tracked changes; allow unrelated untracked local files

The linked local checkout's preflight and apply recheck inspect tracked/index changes but do not reject unrelated untracked files. Git's checkout/merge safeguards still reject any untracked path that would be overwritten. Managed or separately selected checkouts retain their existing stricter untracked-file check. This lets a local-only directory such as `.superpowers/` coexist with a safe update without deleting it.

### Keep the global link when updating its own checkout

If the selected checkout is the runtime source, the command verifies the updated bundle and returns `updated` without `npm install -g`. Reinstall remains required when an explicit override selects a different checkout. A local source that is not a Git checkout is blocked rather than cloned over an existing package directory.

## Risks / Trade-offs

- [Local untracked path collides with a new tracked path] → Git rejects the checkout/merge; the path is preserved and the command reports the failed phase.
- [Remote advances between planning and apply] → Merge only the planned commit; the next check can report a newer target.
- [Runtime bundle changes during the running command] → The process completes with its loaded code; the next invocation loads the updated bundle from the same path.
- [Existing local tracked changes] → Preflight blocks before checkout mutation; no automatic stash or cleanup.

## Migration Plan

Update manager, tests, documentation, and committed CLI bundle in one change. Validate isolated local and managed cases, then publish. The first local `chc source update` after installation of the new bundle can update its own checkout; existing installations using an older bundle must receive that bundle through the normal Git workflow once.
