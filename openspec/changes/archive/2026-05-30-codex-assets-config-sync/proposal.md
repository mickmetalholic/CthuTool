## Why

The current `apps/cli` Codex config workflow treats repository `.codex/` as the backup and restore root, but this repository already uses `.codex/` as project-local agent context. The workflow needs a clearer ownership boundary so shared Codex prompts, rules, skills, and plugins can be maintained under a dedicated repository directory without mixing in runtime state, plugin caches, or project-specific agent instructions.

## What Changes

- Move the CLI-managed repository Codex root from `.codex/` to root-level `codex/`.
- Keep repository `.codex/` completely outside the backup and restore workflow.
- Export local prompts and rules into `codex/prompts` and `codex/rules`.
- Split Codex sync into two source-of-truth flows: repository-owned skills/plugins flow only from `codex/skills` and `codex/plugins` to the local machine, while local prompts/rules and non-repository install intent flow from local machine to repository during export.
- Record local user-installed skill and personal marketplace plugin intent in manifests without copying local skill/plugin files into the repository.
- Treat `chc codex apply` as the config restore/bootstrap command: restore backed-up prompts/rules, restore external skills from Codex's official local import cache or official curated/experimental repositories when available, and report unsupported or unavailable external/marketplace entries with a manual install hint instead of pretending they were restored.
- Add `chc codex install` as the repository-owned asset install command: install repository-owned skill/plugin entries from `codex/skills` and `codex/plugins`, including plugin cache synchronization.
- Ignore system skills and plugin-provided skills as independent skill assets, without surfacing plugin-provided skills to users as separate config-sync items.
- Improve `chc codex status` human output so it is visually structured, colorful, and easy to scan while keeping JSON output machine-stable.
- Remove the user-visible `chc codex plugins` command and route repository plugin restoration through `chc codex install`.
- Remove the user-visible `chc codex diff` and `chc codex doctor` commands; detailed comparison and repository safety checks live under `chc codex status`.
- **BREAKING**: `chc codex export`, `apply`, and `status` now use `repoRoot/codex` instead of `repoRoot/.codex` as the managed repository root.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-cli-codex-config`: Change repository-managed Codex config behavior from `.codex/` to `codex/`, clarify skill and plugin ownership manifests, and exclude project-local `.codex/` from export/apply/status.

## Impact

- `apps/cli/src/infra/codex-config-paths.ts` path defaults and terminology.
- `apps/cli/src/domain/codex-config-manager.ts` export, apply, install, status, safety-check, and manifest behavior.
- `apps/cli/src/command/codex.command.ts` help text and human-readable command output, especially the status presentation.
- CLI unit and integration tests for Codex config pathing, manifests, safe export/apply, and status safety checks.
- Documentation that describes the repository-managed Codex layout.
