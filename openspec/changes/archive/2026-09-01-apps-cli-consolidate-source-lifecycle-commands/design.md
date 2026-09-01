## Context

See `proposal.md` for motivation. Root command registration currently exposes `status` and `update` as public commands, while the `source` group publicly registers `list`, `use`, and `register`. The status and update command definitions also embed their route identity in diagnostics and JSON output, so registering the same command object under `source` without adaptation would produce the old machine `command` values.

Command discovery already distinguishes `public` and `compat` registrations and derives help/completion from that visibility. The existing status renderer, self-update planner/runner, locking, Git safety, committed-bundle checks, and global installation verification are route-independent and must remain the single implementation of lifecycle behavior.

This change follows `apps-cli-streamline-source-selection`: it assumes `source current` and `source use --bootstrap` have been removed and missing managed selection is already handled by `source use remote`. Its delta specs are additive for source switching so the two active changes do not modify the same requirement block or require a particular archive order.

## Goals / Non-Goals

**Goals:**

- Make `source` the only discoverable namespace for source inventory, diagnosis, selection, managed update, and registration.
- Reuse one status implementation and one update implementation across canonical and compatibility routes.
- Preserve existing flags, update safety, human rendering, quiet behavior, errors, exit status, and legacy JSON envelopes.
- Make route identity explicit so canonical JSON and diagnostics identify `source status` or `source update` without changing legacy callers.

**Non-Goals:**

- Merge the multi-candidate `source list` inventory with the single-installation `source status` diagnosis.
- Add selectors to `source status` or `source update`; the existing `--install-dir`, `--repo`, and `--ref` controls remain the explicit override model.
- Make `source update` switch an active source, update development worktrees, or change managed update preflight rules.
- Remove the top-level compatibility aliases or choose a release in which they will be removed.
- Change source discovery, source registry data, installer scripts, or self-update domain models.

## Decisions

### 1. Register canonical commands under source and compatibility aliases at root

Add public `status` and `update` registrations to the existing source command group. Change the root `status` and `update` registrations from `public` to `compat`, using the same discovery mechanism already used by the hidden `version` alias. Bare `chc source` therefore remains help-first and shows the complete public source lifecycle surface, while direct legacy invocations still resolve normally.

Keeping both routes public was considered, but it would preserve the split command model and leave root help/completion ambiguous. Removing the root registrations immediately was also considered, but these older entry points can be used by scripts and have machine-output contracts worth preserving during migration.

### 2. Parameterize route identity around shared command bodies

Refactor status and update command construction to accept a small immutable route descriptor containing:

- the diagnostic command/subcommand identity;
- the successful JSON `command` string;
- the command metadata name and description when they differ by registration context.

Create canonical source instances with diagnostic scopes `source/status` and `source/update` and JSON identities `source status` and `source update`. Create root compatibility instances with the existing diagnostic scopes and JSON identities `status` and `update`. Both instances call the same status reader, renderer, update planner/runner, failure adapter, and argument definitions.

Inferring the route from process arguments inside the handler was rejected because tests and programmatic command invocation should not depend on global argv parsing. Duplicating handlers was rejected because their safety and error behavior could drift.

### 3. Keep list and status as separate read models

`source list` remains the inventory view over all candidates and continues to identify the active candidate. `source status` remains the detailed view of one actual or explicitly overridden installation, including version, source identity, Git metadata, bundle state, and local commit metadata where available.

Adding detailed status fields to every list row was considered, but it would make the default inventory noisy, increase discovery work, and blur the difference between “what can I select?” and “what is this installation?”. Removing status was rejected because list does not expose the diagnostics needed to troubleshoot the active installation.

### 4. Preserve legacy output without deprecation noise

Compatibility routes retain their existing JSON `command` values and do not emit a new deprecation warning. Human, quiet, and failure output likewise remains unchanged. Migration is communicated through discoverability and documentation: root help/completion omit the aliases, source help presents the canonical replacements, and docs use the new forms.

Emitting a warning on every legacy call was considered, but it would alter stderr expectations and add special handling for quiet and JSON callers. An undiscoverable alias plus documentation provides a safer first migration phase.

### 5. Drive help and completion from registration visibility

Extend source registrations rather than adding command-name exceptions to help or completion. Root compatibility registrations remain executable but are excluded by the existing discovery rules. Tests should verify root and source registration metadata, generated shell completion, bare-group behavior, and direct compatibility dispatch.

This keeps the public surface declared in one place and avoids maintaining separate hard-coded help/completion lists.

### 6. Treat documentation and the committed bundle as part of the command migration

Update root and CLI README material plus docs-site command/source/install/reference pages to use `source status` and `source update`, explain the list/status distinction, and mention top-level aliases only in migration guidance. Refresh the committed `apps/cli/dist/index.js` after source changes so lightweight GitHub installs receive the same command surface without a local build toolchain.

Generated OpenSpec adapter trees are reproducible setup output and are not part of this command change. The protected `codex/plugins/cthu-codex` business plugin remains untouched.

## Risks / Trade-offs

- [Reusing a command definition under two parents can leak the wrong route identity] → Construct route-specific command instances around shared handler logic and assert both diagnostic scopes and JSON `command` values.
- [Changing registration visibility can accidentally make an alias unreachable] → Cover direct root dispatch separately from root help and completion discovery.
- [Canonical and compatibility flags can drift] → Share the same immutable argument definitions and exercise representative overrides and `--check` through both routes.
- [Documentation can keep teaching the old entry points] → Search repository-owned docs and tests for canonical `chc status`/`chc update` examples, retaining old forms only in explicit compatibility sections.
- [The committed bundle can lag source] → Refresh it after implementation and run the bundle parity/global CLI checks already used by CLI changes.
- [Two active source-related changes can overlap during sync] → Keep this change's source delta additive and archive/sync each change independently; do not edit or sync the neighboring change as part of apply.

## Migration Plan

1. Parameterize status/update command construction around route identity while keeping the current root instances behaviorally unchanged.
2. Register canonical status/update instances publicly under `source`, then mark root registrations as compatibility-only.
3. Update command discovery, completion, focused unit/integration tests, and all canonical documentation examples.
4. Refresh and verify the committed CLI bundle, then validate direct canonical and legacy invocations in human and JSON modes.

Rollback restores root registrations to public visibility and removes the two source registrations. Because handlers, domain state, source registry, managed checkout, and installer data are unchanged, rollback requires no data migration.
