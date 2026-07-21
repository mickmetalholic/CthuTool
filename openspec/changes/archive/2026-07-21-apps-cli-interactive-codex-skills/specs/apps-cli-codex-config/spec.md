## MODIFIED Requirements

### Requirement: Codex command group
The CLI SHALL expose a `codex` command group with only the public maintenance commands that own reproducible Codex assets.

#### Scenario: Codex group is registered
- **WHEN** a user runs the CLI help for top-level commands
- **THEN** the command list includes `codex`
- **AND** the `codex` command lists exactly `skills` and `install` as public subcommands

#### Scenario: Removed config sync commands are rejected
- **WHEN** a user runs `chc codex status`, `chc codex export`, or `chc codex apply`
- **THEN** the CLI rejects the command as unknown
- **AND** it does not read or write local prompts or rules

#### Scenario: Codex help is shown when no subcommand is provided
- **WHEN** a user runs `chc codex` without a nested command
- **THEN** the CLI prints help for the `codex` command group
- **AND** the help lists `skills` and `install`
- **AND** it exits successfully without prompting

### Requirement: Repository-managed Codex root
The CLI SHALL use `repoRoot/codex` only for the third-party skill manifest and repository-owned plugin sources managed by the remaining Codex commands.

#### Scenario: Skills uses repository manifest
- **WHEN** a user runs `chc codex skills`
- **THEN** the command resolves managed desired state from `repoRoot/codex/skills.manifest.json`
- **AND** it does not treat `repoRoot/.codex` as part of personal skill management

#### Scenario: Install uses repository plugins
- **WHEN** a user runs `chc codex install`
- **THEN** the command discovers repository-owned plugins from `repoRoot/codex/plugins`
- **AND** it leaves repository and local prompts, rules, and standalone skill directories unread and unwritten

#### Scenario: Project codex directory is ignored
- **WHEN** repository `.codex` contains project-local agent instructions, skills, or generated command adapters
- **THEN** `chc codex skills` and `chc codex install` leave that content unread and unwritten

## REMOVED Requirements

### Requirement: Read-only codex status
**Reason**: The configuration comparison mixed machine-specific prompt/rule state with reproducible plugin and skill management; the new interactive skill view owns managed skill status while plugin installation remains explicit.
**Migration**: Use `chc codex skills --json` for managed third-party skill inventory and `chc codex install` to install repository-owned plugins.

### Requirement: Safe codex export
**Reason**: Local prompt/rule mirroring and local-directory-derived skill intent are no longer supported ownership models.
**Migration**: Add third-party skills explicitly through `chc codex skills`; keep prompts, rules, and unmanaged skills local.

### Requirement: Safe codex apply
**Reason**: Repository-to-local prompt/rule mirroring is machine-specific and external skill restoration moves to the dedicated skill manager.
**Migration**: Use `chc codex skills` to install manifest-managed GitHub skills.

### Requirement: Repository-owned codex install
**Reason**: Repository-owned standalone skills are removed from the supported model and plugin installation is already specified by `apps-cli-codex-plugin-management`.
**Migration**: Package reusable repository-owned workflows inside plugins and install them with `chc codex install`.

### Requirement: Versioned manifests
**Reason**: Skill desired state receives a dedicated schema in `apps-cli-codex-skill-management`, while plugin manifest behavior belongs to plugin management.
**Migration**: Explicitly migrate supported GitHub skills into the new skill manifest schema; do not infer sources from legacy local-only entries.

### Requirement: Safe path boundaries
**Reason**: Its export/apply-specific write boundaries disappear with those commands; remaining commands define their own manifest, plugin, and local-install boundaries.
**Migration**: Preserve path validation in the dedicated skill and plugin implementations.

### Requirement: Machine-readable output support
**Reason**: The removed status JSON contract no longer exists, and each remaining subcommand owns its machine-readable response.
**Migration**: Use the JSON contracts specified for `chc codex skills` and `chc codex install`.
