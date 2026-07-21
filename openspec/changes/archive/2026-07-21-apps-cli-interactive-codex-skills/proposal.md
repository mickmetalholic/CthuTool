## Why

The current Codex configuration workflow mirrors machine-specific prompts and command-approval rules and records local skills without enough upstream metadata to reinstall or update them reliably. Codex maintenance should instead focus on the two reproducible assets this repository actually needs: repository-owned plugins and explicitly selected third-party GitHub skills.

## What Changes

- **BREAKING** Reduce `chc codex` to exactly two public subcommands: `skills` and `install`; remove `status`, `export`, and `apply`.
- Add `chc codex skills` as an interactive third-party skill manager backed by a pinned `npx skills` CLI version.
- Treat `codex/skills.manifest.json` as repository-tracked desired state for managed GitHub skills, not as an export of locally discovered skill directories.
- Let users select install, replace, update, add, and remove actions from a reviewed execution plan before `npx skills` mutates local state.
- Ignore local skills that are absent from the manifest and exclude system, plugin-provided, runtime, and other unmanaged skills from management.
- Stop mirroring or comparing local Codex prompts and rules, and remove repository-owned skill installation from `chc codex install`.
- Keep `chc codex install` focused on repository-owned plugin registration, enablement, and cache synchronization through `codex/plugins.manifest.json` and `codex/plugins`.
- Update shell completion, documentation, JSON/non-interactive behavior, and tests for the reduced command surface.

## Capabilities

### New Capabilities
- `apps-cli-codex-skill-management`: Interactive and non-interactive reconciliation of manifest-managed third-party GitHub skills through `npx skills`.

### Modified Capabilities
- `apps-cli-codex-config`: Reduce the Codex command group to `skills` and `install`, retire prompt/rule synchronization, and redefine the repository-managed Codex surface.
- `apps-cli-codex-plugin-management`: Remove status/export/apply coupling and keep repository plugin installation isolated under `chc codex install`.
- `apps-cli-shell-completion`: Offer only `skills` and `install` after `chc codex` and complete the supported flags for the new skill manager.

## Impact

- Affected CLI code: `apps/cli/src/command/codex.command.ts`, Codex config/skill/plugin domain modules, CLI context and completion registrations, tests, and CLI documentation.
- Affected repository state: `codex/skills.manifest.json`; obsolete repository prompt/rule sync assets and code can be removed after migration review.
- New runtime dependency boundary: a pinned, validated `npx skills` command contract for GitHub skill discovery and lifecycle operations.
- Existing unmanaged local skills remain untouched; existing repository plugins continue to install through `chc codex install`.
