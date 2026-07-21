## 1. Skill Desired State and Backend

- [x] 1.1 Define and validate the version 2 `codex/skills.manifest.json` schema for GitHub repository, selector, tracking ref/pin, enabled state, deterministic ordering, and atomic path-bounded writes.
- [x] 1.2 Add a domain-facing `SkillsBackend` interface plus result/error types for discovery, installed-source lookup, update checks, install, update, and remove operations.
- [x] 1.3 Select and pin an exact `skills` package version, implement the `npx --yes skills@<version>` Codex user-scope adapter, and add fixture-based contract tests that fail closed on unsupported output or metadata.
- [x] 1.4 Implement managed inventory classification for missing, installed, update-available, unmanaged-collision, disabled, and legacy entries without enumerating unrelated local skills into desired state.
- [x] 1.5 Replace the legacy version 1 repository skill manifest with an empty version 2 desired-state manifest and report non-source legacy entries as explicitly unsupported rather than guessing migration sources.

## 2. Interactive Skills Workflow

- [x] 2.1 Register `chc codex skills` and render the interactive managed-skill table with source, local state, upstream state when known, current action, keyboard navigation, and state-valid Space cycling.
- [x] 2.2 Implement the Add flow for GitHub source entry/search, backend discovery, multi-selection, tracking mode, and explicit related-skill selection.
- [x] 2.3 Build the deterministic execution-plan preview and default-negative confirmation flow, including clean cancellation with no writes.
- [x] 2.4 Execute install, update, enable, and remove actions through `SkillsBackend`, committing manifest edits only after successful local outcomes and reporting partial completion accurately.
- [x] 2.5 Implement explicit Replace for unmanaged name collisions with temporary rollback snapshots and restoration on backend failure.
- [x] 2.6 Implement read-only `--json` inventory output and a clear non-interactive failure path that never selects or performs mutations implicitly.

## 3. Plugin-Only Install Boundary

- [x] 3.1 Extract the repository plugin install orchestration from the existing Codex config manager into a plugin-focused module without changing marketplace registration, enablement, hook normalization, MCP metadata, or cache synchronization behavior.
- [x] 3.2 Remove standalone repository skill discovery and installation from `chc codex install`, including reads of `codex/skills.manifest.json` and `codex/skills`.
- [x] 3.3 Preserve `chc codex install` human/JSON results and supported repository, Codex home, marketplace, plugin root, and cache overrides while removing arguments used only by retired config sync behavior.

## 4. Retire Codex Config Synchronization

- [x] 4.1 Remove `status`, `export`, and `apply` command registrations, rendering, confirmation, comparison, prompt/rule mirroring, external-skill restore, and obsolete config-manager code.
- [x] 4.2 Reduce bare `chc codex` help to exactly `skills` and `install`, and ensure retired subcommands fail as unknown without reading or writing Codex state.
- [x] 4.3 Remove obsolete repository prompt/rule sync assets, including `codex/rules/default.rules`, after confirming no remaining implementation consumes them.
- [x] 4.4 Update zsh/PowerShell completion registrations and boundary tests so `chc codex` completes only `skills` and `install` with their supported flags.
- [x] 4.5 Update CLI and Codex documentation to describe manifest-managed GitHub skills, the interactive workflow, unmanaged-skill exclusion, the pinned `npx skills` backend, and plugin-only install semantics.

## 5. Verification

- [x] 5.1 Add unit tests for manifest validation/writes, inventory state/action transitions, unmanaged exclusion, legacy handling, plan generation, partial failures, and replacement rollback.
- [x] 5.2 Add CLI integration tests for interactive selection with mocked prompts/backend, JSON read-only output, non-TTY safety, exact help output, and rejection of retired subcommands.
- [x] 5.3 Retain or update plugin integration tests covering enabled/disabled plugins, marketplace registration, config enablement, hook path normalization, MCP metadata, and cache synchronization.
- [x] 5.4 Run targeted Biome checks, the CLI TypeScript type check, affected unit/integration tests, and `git diff --check`; confirm generated `.claude/`, `.codex/`, and `.cursor/` adapters remain unchanged.
- [x] 5.5 Run `openspec validate apps-cli-interactive-codex-skills --type change --strict --no-interactive` and `openspec status --change apps-cli-interactive-codex-skills`, resolving any artifact or requirement errors before implementation handoff.
