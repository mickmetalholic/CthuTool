## Context

See `proposal.md` for motivation. Source discovery currently returns one canonical inventory containing the active source, development worktrees, and the default managed candidate. The command layer renders that inventory independently for `list`, `current`, and the interactive `use` prompt. It filters `available: false` candidates before prompting, so an absent managed checkout is present in `list` but disappears from `use` unless the caller already supplied `--bootstrap`.

The managed path is fixed at the self-update install directory. Existing source-switching safety already distinguishes local relinking from the managed install/update flow, verifies the committed CLI bundle, serializes global npm mutation, and verifies the installed package target. The change must preserve those boundaries while making an explicitly selected missing remote actionable.

## Goals / Non-Goals

**Goals:**

- Keep source discovery as the single truth for list, selection, completion, and selector resolution.
- Make human list and prompt terminology consistent while preserving canonical JSON data.
- Treat selection of a genuinely absent managed checkout as explicit authority to provision it safely.
- Keep existing managed selection free of implicit refresh and reject existing invalid paths without overwriting them.
- Remove redundant command and option branches instead of retaining hidden aliases.

**Non-Goals:**

- Change worktree discovery, registry identity, selector hashing, npm link ownership, or update preflight rules.
- Automatically build a development bundle, repair an invalid managed directory, or update an existing managed checkout.
- Change the `source list --json` candidate schema or abbreviate canonical machine paths.
- Relocate the established top-level `status` and `update` lifecycle commands into the `source` namespace; that follow-up changes both source-switching and self-installation contracts and needs an explicit compatibility migration.
- Introduce a new prompt or table dependency.

## Decisions

### 1. Reduce the public command surface to list, use, and register

Remove the `current` command registration, implementation, help/completion entry, documentation, and dedicated tests. `source list` remains the source inventory API and continues to expose a top-level `active` object in JSON. `chc status` remains the detailed installation diagnostics API.

Keeping `current` as a hidden compatibility alias was considered, but the source feature is new, the alias would preserve a second output contract, and existing callers have direct replacements. The removed operation therefore uses normal unknown-command behavior.

The established top-level `status` and `update` commands are intentionally unchanged in this change. A follow-up namespace consolidation should move both together to `source status` and `source update`, keep the top-level forms as undiscoverable compatibility aliases for a migration period, preserve their existing flags and safety behavior, and define route-specific JSON `command` values. Treating that work separately avoids applying the no-alias decision for the new `source current` operation to older lifecycle entry points with existing callers, and keeps the corresponding `apps-cli-self-installation` contract explicit.

### 2. Model managed selection as a three-way state transition

The source manager will distinguish managed target state before mutation:

| Managed state | `source use remote` behavior |
| --- | --- |
| Path absent | Acquire the source-switch lock, run the safe managed install flow, verify the resulting candidate and global package target, then report success. |
| Valid checkout with bundle | Relink locally or return already-active; do not fetch or update. |
| Path exists but checkout or bundle is invalid | Fail before managed install or npm mutation with repair/update guidance. |

This distinction must be typed or derived from explicit filesystem/repository inspection, not inferred by matching a human `reason` string. Only the absent state bypasses the normal `available` assertion. The existing `bootstrapped` switch-result status may remain as the machine-readable success status to avoid an unnecessary JSON result rename.

Automatically running the managed flow for every unavailable remote was rejected because a typo, partial clone, missing bundle, or unrelated existing directory must not authorize overwrite or Git mutation.

### 3. Treat remote selection itself as explicit provisioning intent

Remove the `bootstrap` command argument and the option passed through `switchCliSource`. Direct `source use remote` and choosing remote from the interactive prompt carry the same intent. If provisioning is required, it reuses the established self-update install path rather than duplicating clone, checkout, bundle, Node, npm, or postcondition logic.

The source-switch lock covers provisioning and final verification. A failed provision never reports remote active; the next process continues to resolve through the prior global link. An existing managed checkout is never refreshed by this path. Users switch to it and use `chc update`, or use the existing explicit update-directory controls when managing it from another active source.

### 4. Introduce a shared human candidate presentation model

Derive a presentation row from each `CliSourceCandidate` with:

- primary selector;
- source kind and branch/detached ref;
- one user-facing state: `active`, `ready`, `not installed`, or `unavailable`;
- a home-relative display path;
- an optional bounded action hint.

Both the two-line `source list` renderer and the one-line interactive choice label consume this model. Discovery candidates and JSON serialization remain unchanged. The prompt includes ready candidates plus a missing managed candidate; other unavailable candidates remain non-actionable and are explained by list/warnings rather than passed to switching.

The intended human hierarchy is:

```text
◆ CthuTool sources

● local                  main · branch main · active
  ~/Documents/GitHub/mickmetalholic/CthuTool

○ worktree:8cafbf4e7265  worktree · detached · ready
  ~/.codex/worktrees/42e5/CthuTool

◌ remote                 managed · not installed
  ~/.cthutool/source/CthuTool
  Selecting remote will install and switch to it.
```

The renderer applies color after spacing decisions so ANSI escape sequences do not affect alignment. It abbreviates a path only when it is equal to or contained by the resolved home directory; JSON and error details keep canonical paths.

### 5. Keep machine output additive except for removed entry points

`source list --json` retains `active`, `candidates`, warnings, canonical paths, availability, bundle, ref, and repository metadata. Switching a missing remote returns the existing structured switch result after successful provisioning. The intentional breaking changes are limited to removal of `source current` and `--bootstrap`; no candidate field is renamed or removed.

Tests should assert semantic rows and states rather than snapshotting terminal colors. Interactive tests inject the existing interaction boundary and verify that the missing managed candidate is offered. Integration tests cover help/completion removal, direct automatic provisioning through fakes, and stable JSON behavior without performing a real global installation.

## Risks / Trade-offs

- [Selecting remote can now perform network and filesystem work] → Make the missing state explicit in the prompt/list, document the behavior, and run only after the user directly selects remote.
- [An absent path can appear between inspection and provisioning] → Hold the existing switch lock and rely on managed install preflight to revalidate before mutation.
- [A partially created managed directory could be mistaken for a missing install] → Auto-provision only when the exact managed path does not exist; any existing invalid state fails closed.
- [Human path abbreviation could obscure identity] → Abbreviate only the home prefix and retain canonical paths in JSON, errors, and switching logic.
- [Removing entry points breaks early scripts] → Document direct migrations to `source list --json` and `source use remote`; keep stable candidate/result structures.

## Migration Plan

1. Add the managed-state distinction and automatic absent-path provisioning while preserving the existing switch lock and verification.
2. Add the shared candidate presentation model and move list/prompt rendering onto it.
3. Remove `current` and `--bootstrap` from command registration, help, completion, docs, and tests.
4. Refresh the committed CLI bundle and verify source unit/integration/completion/global-link behavior.

Rollback restores the prior command registration, explicit `--bootstrap` branch, and list renderer together. Main/worktree discovery and the user source registry require no data migration.
