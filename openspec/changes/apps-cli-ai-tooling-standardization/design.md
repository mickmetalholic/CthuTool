## Context

The repository currently contains several copies of OpenSpec skills under legacy agent directories, divergent copies of `ui-ux-pro-max`, a tracked but stale `reasonix.toml`, and documentation that describes paths and commands no longer present in the repository. The installed OpenSpec CLI is older than the current generator model, while Reasonix 0.53.2 already reads the shared `.agents/skills` format.

The repository also has distinct skill ownership paths that must remain separate:

- OpenSpec owns its workflow skills and tool-specific command/skill generation.
- `npx skills` owns third-party reusable skills.
- `chc codex skills` remains the Codex user-scope manager for manifest-backed GitHub skills.
- `codex/plugins/cthu-codex` is a business plugin and is explicitly outside this change.

The existing project policy says generated agent adapters are regenerated per tool/platform rather than hand-authored. The design therefore treats `openspec/` as the durable input, and generated agent directories as reproducible outputs.

## Goals / Non-Goals

**Goals:**

- Upgrade and standardize the OpenSpec setup for Codex, Cursor, OpenCode, and the shared `agents` target.
- Give Codex and Reasonix one shared `.agents/skills` OpenSpec surface while retaining native Cursor and OpenCode outputs.
- Remove the repository-local `ui-ux-pro-max` copies and document the supported `npx skills` source-based installation path.
- Remove stale Reasonix configuration and use only the installed Reasonix-supported project settings and skill discovery paths.
- Make onboarding and regeneration reproducible without editing generated adapter files by hand.

**Non-Goals:**

- Changing product/runtime behavior or public APIs.
- Changing the `codex/plugins/cthu-codex` business plugin or its MCP/skill behavior.
- Replacing the existing `chc codex skills` manifest contract.
- Installing `ui-ux-pro-max` as a project dependency during this change.
- Making all four tools expose identical command syntax; native invocation syntax remains tool-specific.

## Decisions

### OpenSpec is the workflow source of truth

Use the current OpenSpec CLI generation model and the core workflow set. Configure `codex`, `cursor`, `opencode`, and `agents`, then regenerate with `openspec update` after CLI or profile changes. OpenSpec-managed names are limited to `openspec-*`; unrelated agent files are preserved.

Alternative considered: continue maintaining copied OpenSpec skills under `.codex/`, `.cursor/`, and `.claude/`. Rejected because the copies already drift and the older skills contain tool-specific references that do not work consistently across agents.

### Shared and native adapter surfaces

Use `.agents/skills` as the shared OpenSpec skill surface for Codex and Reasonix. Generate Cursor output under `.cursor/` and OpenCode output under `.opencode/`. Reasonix invokes the shared skills through its `/skill <name>` interface; Codex and the other tools use their native skill or command forms.

Alternative considered: generate a separate Claude-format copy only for Reasonix. Rejected as the default because it creates another collision-prone copy; keep it as a documented fallback only if a future Reasonix release stops reading `.agents/skills`.

### Third-party skills use `npx skills`

The repository documents `nextlevelbuilder/ui-ux-pro-max-skill` as the verified upstream source and selects only `ui-ux-pro-max` when a developer explicitly wants it. No UI/UX skill is installed by default.

Alternative considered: add third-party skills to `codex/skills.manifest.json` or copy them into every agent directory. Rejected because the manifest is intentionally Codex user-scope/GitHub lifecycle state and manual copies create source and version ambiguity.

### Reasonix configuration stays minimal

Remove the legacy `reasonix.toml` because the installed Reasonix release uses JSON configuration and built-in project skill roots. Create a project-level `.reasonix/settings.json` only when a repository-specific setting is actually required; do not store absolute workstation paths or personal permissions in the repository.

Alternative considered: repair `reasonix.toml` to match the old documented schema. Rejected because the installed runtime does not use that file and the current file contains stale machine-specific paths.

## Risks / Trade-offs

- [Generated outputs are absent after a fresh clone] → Add a documented, idempotent setup command that installs the selected OpenSpec adapters for all four tools; verify the generated paths in CI or a repository doctor command.
- [OpenSpec upgrade removes or relocates legacy files] → Run `openspec update --force` only after reviewing the generated diff; limit cleanup to OpenSpec-managed names and preserve unrelated agent files.
- [Third-party source changes unexpectedly] → Pin or record the source/ref used by the setup workflow and require explicit review before changing it.
- [Removing `ui-ux-pro-max` breaks an undocumented personal workflow] → State the verified upstream install command in the docs and keep removal limited to the repository-local copies.

## Migration Plan

1. Upgrade the OpenSpec CLI to the selected current version and configure the four target tools using the core profile.
2. Generate the new OpenSpec surfaces, inspect the diff, and remove only obsolete OpenSpec-managed copies.
3. Remove repository-local `ui-ux-pro-max` and the stale Reasonix TOML configuration; preserve unrelated business plugin files.
4. Add the idempotent OpenSpec setup and discovery checks.
5. Update `AGENTS.md`, `openspec/config.yaml`, `.codex/README.md`, and the user-facing AI tooling documentation.
6. Validate OpenSpec health, generated-path ownership, `npx skills` source selection, Reasonix skill discovery, and the repository's targeted lint/type/diff checks.

Rollback is to restore the generated adapter files and project configuration from version control, then rerun the previous OpenSpec setup. The change does not alter runtime data or product APIs.

## Open Questions

- Should generated adapters remain ignored as required by the existing project policy, or should the repository explicitly change that policy and commit them for easier onboarding?
- Should the setup command be a root package script, a `chc` command, or a standalone repository script?
