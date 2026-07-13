## Context

The CLI currently has a reliable Citty command tree for static groups such as `codex`, but several discovery behaviors live outside that tree:

- top-level bare-command help is selected by a name whitelist in the entrypoint;
- compatibility and internal command visibility is filtered separately in help and completion;
- `completion` lifecycle actions are parsed from `rawArgs` and repeated as hard-coded completion candidates;
- bundled scripts are dynamically discovered for execution and completion, but not represented in help;
- current OpenSpec requirements and entrypoint interception disagree about what a bare `chc scripts` invocation does.

The design must preserve existing documented invocations, keep dynamic script discovery inexpensive and failure-tolerant, and continue using Citty rather than introducing another CLI framework.

## Goals / Non-Goals

**Goals:**

- Establish one registration model for static command dispatch, visibility, help, completion, and bare behavior.
- Represent completion lifecycle operations as real Citty commands without changing existing user syntax.
- Give bundled scripts canonical `list` and `run` operations while retaining positional and `--script` shorthand.
- Use one discovered script catalog for help, listing, completion, interactive selection, and execution.
- Make command-discovery consistency enforceable with focused invariant tests.

**Non-Goals:**

- Describe every bundled script option in `script.json` or synthesize full Citty argument schemas for scripts.
- Remove existing `chc completion <shell>`, `chc completion <action> <shell>`, `chc scripts <id>`, or `chc scripts --script <id>` forms.
- Add support for new shells or change profile file semantics.
- Change bundled script execution, JSON summary, diagnostics, or progress contracts after target selection.
- Replace Citty or build a general-purpose CLI framework.

## Decisions

- Add a thin CLI registration layer around Citty command definitions.
  - Each registration carries a stable name, `CommandDef`, visibility (`public`, `compat`, or `internal`), and bare behavior (`help` or `run`).
  - Root dispatch, root help, and root completion consume the same registrations.
  - Rationale: visibility and bare behavior are command metadata, not properties that should be inferred repeatedly from command names.
  - Alternative considered: retain independent hidden-name and omitted-command sets. That is smaller initially but preserves the drift this change is intended to remove.

- Use the real Citty tree as the source of truth for static nested operations.
  - `completion` registers `powershell`, `zsh`, `enable`, `disable`, and `status` as actual children.
  - `enable`, `disable`, and `status` accept a shell positional argument; `powershell` and `zsh` remain leaf commands that emit adapters.
  - A single supported-shell definition supplies validation and shell candidates.
  - Rationale: existing command syntax already looks hierarchical, so representing it hierarchically eliminates raw argument dispatch and hard-coded action candidates without a user migration.
  - Alternative considered: introduce `completion generate <shell>`. It is structurally uniform but makes common `source <(chc completion zsh)` usage more verbose and requires unnecessary documentation churn.

- Model bundled scripts as a dynamic catalog behind static `scripts list` and `scripts run` operations.
  - `chc scripts` is a public group whose bare behavior renders group help plus an `AVAILABLE SCRIPTS` catalog.
  - `chc scripts list` renders the catalog and supports machine-readable JSON.
  - `chc scripts run <id>` is the canonical execution form and retains interactive selection when the id is omitted in an interactive context.
  - The parent command continues routing `chc scripts <id>` and `chc scripts --script <id>` to the same runner as compatibility shorthand.
  - Rationale: script ids and descriptions are dynamic, but the catalog manifest does not describe each script's complete option schema. Treating every id as a generated Citty command would imply stronger schemas than the repository has.
  - Alternative considered: generate a subcommand per script id. That gives a native `COMMANDS` table but complicates arbitrary script option forwarding, startup discovery failures, and contributor manifests.

- Introduce a shared dynamic discovery provider for catalog-backed help and completion.
  - The provider returns bounded name/title/description rows from existing `discoverScripts()` and `listSelectable()` behavior.
  - Human help and list output may report discovery warnings; internal completion remains silent on failure.
  - Rationale: the same catalog must not be reformatted from separate independently maintained lists.

- Remove entrypoint name whitelists and special completion action lists after registrations and command children carry the required structure.
  - Explicit `--help` and a bare command whose registration selects `help` use the same renderer.
  - Commands selecting `run` reach their command handler instead of being intercepted globally.

- Preserve compatibility through routing and tests rather than duplicate public help entries.
  - Compatibility and internal registrations remain callable but are omitted from help and completion.
  - Existing version compatibility behavior established by the preceding change remains unchanged.

## Risks / Trade-offs

- [Risk] Citty parent commands with both child commands and compatibility positional routing may have ambiguous parsing. → Add parser-level integration tests for `scripts list`, `scripts run <id>`, `scripts <id>`, and `scripts --script <id>` before removing old routing.
- [Risk] Dynamic discovery could make help slower or fail when a manifest is invalid. → Reuse the bounded catalog result, show valid entries with warnings in human output, and keep completion failure quiet.
- [Risk] Refactoring completion commands could alter adapter stdout. → Keep adapter rendering functions unchanged and assert byte-for-byte output behavior through existing integration tests.
- [Risk] Adding `list` and `run` may conflict with future bundled script ids. → Reserve those ids in manifest validation or routing and document them as command-group operations.
- [Trade-off] `scripts` help needs a small custom catalog section because Citty cannot natively render dynamic positional targets. This is preferable to fabricating incomplete command definitions.

## Migration Plan

1. Add command registration and visibility types while keeping existing dispatch operational.
2. Convert `completion` actions and shell emitters into real child commands, then remove raw argument action parsing and hard-coded completion candidates.
3. Add `scripts list` and `scripts run`, shared catalog rendering, and compatibility routing for existing shorthand.
4. Replace the entrypoint bare-command whitelist with registration metadata and derive help/completion visibility from the registry.
5. Update documentation, tests, and the committed CLI bundle; validate both new canonical forms and all compatibility forms.

Rollback is code-only: the previous command definitions and entrypoint routing can be restored without migrating persisted user data or completion profiles.

## Open Questions

- None. Canonical forms, compatibility expectations, and bare-command behavior are defined by the accompanying specs.
