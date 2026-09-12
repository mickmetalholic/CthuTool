## MODIFIED Requirements

### Requirement: OpenSpec skills are available to the five project agents

The repository SHALL commit the OpenSpec core workflow skills for Codex, Cursor, OpenCode, Pi, and ZCode: `explore`, `propose`, `apply`, `update`, `sync`, and `archive`.

#### Scenario: A fresh checkout contains the selected skills

- **WHEN** a developer clones the repository or creates a worktree
- **THEN** shared `openspec-*` skills are already present under `.agents/skills` for Codex, Cursor, OpenCode, and Pi
- **AND** ZCode skills are already present under `.zcode/skills`
- **AND** no repository setup script or checkout hook is needed to generate them

#### Scenario: Codex and Reasonix use the shared skills

- **WHEN** the generated `.agents/skills` directory contains an OpenSpec workflow skill
- **THEN** Codex can invoke that workflow using its native `$openspec-*` form
- **AND** Reasonix can discover the same skill and invoke it through `/skill <skill-name>`
- **AND** the repository does not maintain a second manually copied OpenSpec workflow tree for Reasonix

#### Scenario: OpenSpec is upgraded

- **WHEN** the OpenSpec CLI is upgraded or the selected profile/workflows change
- **THEN** `openspec init` or `openspec update` regenerates the OpenSpec-managed instruction files from the selected CLI version and current configuration
- **AND** the regenerated files are reviewed and committed with the selected workflow set and current tool-specific references
- **AND** the command does not modify product source code, existing OpenSpec specs, or unrelated change artifacts

#### Scenario: Generated files are regenerated rather than hand-edited

- **WHEN** a project policy or tool invocation needs to change
- **THEN** the durable policy is updated in OpenSpec configuration or other repository-owned policy sources
- **AND** the affected OpenSpec adapter files are regenerated
- **AND** unrelated custom skills and instructions are preserved

### Requirement: Reasonix configuration matches the installed runtime

The repository SHALL use the configuration and project skill-discovery paths supported by the installed Reasonix release and SHALL NOT store machine-specific user paths or personal permission state in project configuration.

#### Scenario: Legacy Reasonix configuration is removed

- **WHEN** the AI tooling migration is complete
- **THEN** the repository does not rely on `reasonix.toml`
- **AND** any retained project-level Reasonix settings use the supported `.reasonix/` JSON configuration format
- **AND** no configuration value contains a workstation-specific absolute path

#### Scenario: Reasonix discovers the shared OpenSpec skills

- **WHEN** Reasonix starts in a checkout of the repository
- **THEN** its project skill inventory includes the shared `.agents/skills/openspec-*` workflows
- **AND** the documentation gives the correct Reasonix invocation form

#### Scenario: Desktop session metadata is not treated as shared configuration

- **WHEN** repository state is checked for Reasonix files
- **THEN** local desktop topic/session metadata is either removed from version control or explicitly classified as generated local state
- **AND** it is not described as part of the portable AI tooling contract

### Requirement: AI tooling documentation matches the repository

The repository SHALL document the actual AI tooling directories, installation commands, invocation forms, generated-file policy, and validation checks for Codex, Cursor, OpenCode, Pi, ZCode, and Reasonix.

#### Scenario: Directory ownership is documented

- **WHEN** a developer reads the root agent policy, OpenSpec configuration, or AI tooling reference
- **THEN** the documentation distinguishes committed generated `.agents/skills` and `.zcode/skills` from authored `.cursor/skills` and local `.opencode/`, `.codex/`, `.claude/`, and `.reasonix/` state
- **AND** it identifies which files must not be hand-edited

#### Scenario: Tool invocation is documented

- **WHEN** a developer wants to start an OpenSpec workflow
- **THEN** the documentation provides the correct native invocation for Codex, Cursor, OpenCode, Pi, ZCode, and Reasonix
- **AND** it does not present a command from one tool as if it were supported by all tools

#### Scenario: Setup is repeatable

- **WHEN** a developer clones the repository or changes the selected tools
- **THEN** the checked-in skills are immediately available and the documentation provides a direct OpenSpec CLI regeneration command
- **AND** a second regeneration does not create duplicate skill entries or unrelated configuration changes

### Requirement: AI tooling setup is verifiable

The repository SHALL document read-only checks that confirm OpenSpec health, checked-in skill paths, skill discovery, and the absence of excluded or stale project configuration.

#### Scenario: OpenSpec health is checked

- **WHEN** a developer runs the documented AI tooling verification
- **THEN** it checks `openspec doctor` and reports the resolved OpenSpec root
- **AND** it checks that the configured workflow artifacts match the selected profile

#### Scenario: All five agents can discover the skills

- **WHEN** verification runs after checkout or regeneration
- **THEN** it checks the shared `.agents` OpenSpec skills for Codex, Cursor, OpenCode, and Pi and the native `.zcode` skills for ZCode
- **AND** it checks that Reasonix can see the shared skills
- **AND** it reports missing or stale committed files without silently repairing them

#### Scenario: Business plugin scope is checked

- **WHEN** verification reports changed or generated AI files
- **THEN** it confirms that `codex/plugins/cthu-codex` was not modified by OpenSpec regeneration
- **AND** any difference in that plugin remains an explicit, separately scoped change
