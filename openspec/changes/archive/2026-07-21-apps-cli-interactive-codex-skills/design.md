## Context

`chc codex` currently combines prompt/rule mirroring, local skill discovery, external skill restoration, repository skill copying, plugin status, and plugin installation. The configuration sync portion is both machine-specific and weakly reproducible: command approval rules contain host-specific paths, while version 1 skill entries such as `skill:<name>` do not identify a repository, selector, or version that can reliably reinstall the skill.

The desired model has only two owned asset classes. Repository plugins remain source-controlled under `codex/plugins` and are installed by `chc codex install`. Third-party skills remain owned by their GitHub repositories, are declared in a repository manifest for cross-machine recovery, and are installed or updated by the established `skills` CLI through a new `chc codex skills` interface. Local skills outside that declaration are not CthuTool state.

## Goals / Non-Goals

**Goals:**

- Reduce `chc codex` to the `skills` and `install` subcommands.
- Provide one reviewed interactive interface for adding, installing, replacing, updating, enabling, and removing managed third-party skills.
- Make every managed skill reinstallable from explicit GitHub source metadata.
- Reuse a pinned `npx skills` implementation for remote discovery and lifecycle operations instead of implementing another Git client or skill package manager.
- Preserve a safe read-only JSON inventory and fail safely outside an interactive terminal.
- Keep repository plugin installation behavior intact while removing standalone repository skill and prompt/rule responsibilities.

**Non-Goals:**

- Authoring or vendoring skills in this repository.
- Importing, displaying, backing up, deleting, or updating unmanaged local skills.
- Inferring a GitHub source from a skill name or from natural-language dependencies inside `SKILL.md`.
- Managing system skills, plugin-provided skills, Codex runtime state, prompts, rules, authentication, sessions, or arbitrary `config.toml` content.
- Providing a general multi-agent skill manager; the first version always targets Codex user scope.

## Decisions

### 1. Keep a desired-state manifest, but eliminate directory synchronization

`codex/skills.manifest.json` becomes a version 2 desired-state file. A representative entry is:

```json
{
  "name": "grill-me",
  "source": "github",
  "repository": "mattpocock/skills",
  "selector": "grill-me",
  "tracking": {
    "type": "branch",
    "ref": "main"
  },
  "enabled": true
}
```

`selector` is the skill name or exact repository path passed to the backend. `tracking` is either a moving branch/ref or an explicit tag/commit pin, so the UI can distinguish Update from a deliberately pinned installation. Dependencies that need separate installation are separate manifest entries.

The manifest is analogous to desired dependencies, while the `skills` backend metadata and installed directories are local realization state. No `codex/skills` source directory is created or scanned.

Alternatives considered:

- Rely only on the backend's global lock. This is simpler on one machine but does not give this repository a stable, reviewable desired set for a fresh machine.
- Mirror local directories into the repository. This loses upstream identity, makes updates ambiguous, and risks adopting unrelated personal or generated skills.

### 2. Make `chc codex skills` an interactive reconciler

The command builds rows only from manifest entries. It inspects a local path only when resolving the state of a manifest-managed name; unrelated local directories are never enumerated into the UI or manifest.

Each row has a derived state:

- `missing`: no local installation exists;
- `installed`: compatible backend-managed installation exists;
- `update_available`: the backend reports a newer tracked source;
- `unmanaged_collision`: a local directory exists without compatible source tracking;
- `disabled`: desired state is disabled;
- `legacy`: the old entry does not contain an installable source.

Space cycles through only valid actions. Enter renders a deterministic execution plan and a default-negative confirmation. Add is a separate interactive path that asks for or searches a GitHub source, lets the user select discovered skills, and then includes both installation and manifest edits in the same plan.

Alternatives considered:

- Expose separate `skills add/update/remove/apply` subcommands as the primary interface. This repeats backend concepts and does not provide the requested single reconciliation view.
- Automatically select all recommended actions. Third-party instructions and scripts are executable agent inputs, so explicit selection and review are safer.

### 3. Isolate a pinned `npx skills` backend adapter

A domain-facing `SkillsBackend` interface owns discovery, installed-source lookup, update checks, add, update, and remove. Its production implementation invokes an exact reviewed `skills` package version through `npx --yes skills@<version>` with Codex and global/user scope fixed by the adapter. Command code and manifest code never parse backend output directly.

All dependence on backend output or lock metadata lives in this adapter and is covered by contract fixtures/tests for the pinned version. Unrecognized formats fail closed with an upgrade message. Unit tests use a fake backend; focused integration tests exercise the pinned CLI contract without modifying the developer's actual global skills.

Alternatives considered:

- Use `@latest`. This makes CthuTool behavior change independently of its own release and can silently break prompts or metadata parsing.
- Import undocumented backend internals. A subprocess boundary is less coupled to package implementation layout and matches the documented CLI surface.
- Implement GitHub fetching and update hashing in CthuTool. That duplicates package-manager behavior and expands authentication, private-repository, and version-resolution scope.

### 4. Commit manifest edits only after successful lifecycle operations

The command converts the confirmed plan into ordered per-skill operations. Install/Add writes a manifest entry only after installation succeeds. Remove deletes the entry only after backend removal succeeds or absence is confirmed. Update normally leaves desired source unchanged. Replace snapshots the colliding directory to a temporary rollback location, restores it if installation fails, and removes the snapshot after success.

Manifest writes use a validated schema, repository path-boundary checks, deterministic ordering, and atomic temporary-file replacement. A multi-skill run reports partial success and commits only the desired-state changes justified by completed operations.

Alternatives considered:

- Write the full desired manifest before running the backend. A backend failure would claim a state that was never established and make the next run harder to interpret.

### 5. Keep non-interactive use read-only in the first version

`chc codex skills --json` returns managed inventory and available actions without prompting or writing. A bare invocation without a TTY fails with an actionable message. Mutation flags are intentionally deferred until a stable automation use case exists; `--yes` alone never selects actions.

This preserves the existing CLI output discipline without inventing a second, less-reviewed mutation surface.

### 6. Separate plugin installation before removing config sync code

The current `codex-config-manager` contains both configuration synchronization and plugin installation orchestration. Implementation first extracts or retains the plugin-only path used by `chc codex install`, then deletes prompt/rule comparison and mirroring, external/repository skill application, status rendering, and confirmation code.

`chc codex install` continues reading `codex/plugins.manifest.json`, discovering `codex/plugins`, registering enabled plugins, updating Codex plugin enablement, and synchronizing the personal cache. It no longer reads `skills.manifest.json` or `codex/skills`.

## Risks / Trade-offs

- [Pinned backend eventually becomes stale] → Keep the version in one adapter constant, surface it in diagnostics, and upgrade it through reviewed contract tests.
- [Backend has no stable structured output for some read operation] → Keep parsing isolated, fixture-tested, and fail closed rather than guessing from changed prose.
- [Third-party update changes instructions or scripts unexpectedly] → Require explicit Update selection and show source/ref in the reviewed plan; support pinned tag/commit entries.
- [Replacing an unmanaged collision can destroy personal edits] → Require an explicit Replace action and confirmation, snapshot before mutation, and restore on failure.
- [Version 1 manifest entries cannot be migrated automatically] → Do not guess sources; initialize version 2 desired state explicitly and leave corresponding local installations unmanaged until re-added.
- [Removing status eliminates plugin preflight visibility] → Keep install results machine-readable and human-readable; do not reintroduce a read-only plugin manager through the skills command.
- [Network or GitHub authentication failure] → Preserve the prior manifest and local installation, report the backend error, and allow retry after credentials/network are fixed.

## Migration Plan

1. Introduce the version 2 manifest parser/types, backend abstraction, read-only inventory, and interactive plan model behind tests.
2. Implement add/install/update/remove/replace execution using the pinned backend and atomic manifest writes.
3. Replace the current version 1 `codex/skills.manifest.json` with an empty version 2 desired-state manifest; legacy names are not migrated because their GitHub sources are unknown. Users explicitly add any skill they want managed.
4. Extract the repository plugin-only install path and verify plugin registration, enablement, hook normalization, MCP metadata, and cache synchronization remain unchanged.
5. Remove `status`, `export`, and `apply`, together with prompt/rule mirroring, standalone repository skill installation, unused arguments, tests, and documentation.
6. Remove obsolete repository-managed prompt/rule assets, including `codex/rules/default.rules`, after confirming no remaining code or spec consumes them.
7. Update completion and CLI documentation, then run focused lint, type checks, unit/integration tests, and `git diff --check`.

Rollback restores the previous command registration, config manager, version 1 manifest, and repository rule asset from version control. Local unmanaged skills are unaffected by either migration or rollback.

## Open Questions

None. The initial version intentionally starts with an empty managed third-party set; users populate it through `chc codex skills` so no legacy source is guessed.
