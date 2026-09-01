## ADDED Requirements

### Requirement: AI tooling ownership is explicit

The repository SHALL document and enforce separate ownership for OpenSpec workflow artifacts, third-party skills installed through `npx skills`, and repository-owned business plugins.

#### Scenario: A developer identifies a skill source

- **WHEN** a developer inspects the AI tooling documentation or setup instructions
- **THEN** the documentation identifies whether the skill is OpenSpec-generated, third-party, or business-plugin-owned
- **AND** it identifies the canonical source and the command responsible for updating that source

#### Scenario: OpenSpec workflow skills are managed

- **WHEN** a developer adds, removes, or upgrades an OpenSpec workflow
- **THEN** the developer uses `openspec init` or `openspec update`
- **AND** the developer does not add the workflow to the third-party `npx skills` manifest or copy it manually between agent directories

#### Scenario: The business plugin remains isolated

- **WHEN** the AI tooling setup or documentation is changed
- **THEN** `codex/plugins/cthu-codex` remains outside the project-level skill standardization scope
- **AND** its existing plugin installation and OpenCode synchronization behavior is unchanged

### Requirement: OpenSpec supports the four project agents

The repository SHALL provide a reproducible OpenSpec setup for Codex, Cursor, OpenCode, and the vendor-neutral `agents` target using the core workflow set: `explore`, `propose`, `apply`, `update`, `sync`, and `archive`.

#### Scenario: OpenSpec setup generates the selected surfaces

- **WHEN** a developer initializes or regenerates OpenSpec using the documented setup path
- **THEN** OpenSpec generates shared `openspec-*` skills under `.agents/skills`
- **AND** it generates the native Cursor skill/command surface under `.cursor/`
- **AND** it generates the native OpenCode skill/command surface under `.opencode/`

#### Scenario: Codex and Reasonix use the shared skills

- **WHEN** the generated `.agents/skills` directory contains an OpenSpec workflow skill
- **THEN** Codex can invoke that workflow using its native `$openspec-*` form
- **AND** Reasonix can discover the same skill and invoke it through `/skill <skill-name>`
- **AND** the repository does not maintain a second manually copied OpenSpec workflow tree for Reasonix

#### Scenario: OpenSpec is upgraded

- **WHEN** the OpenSpec CLI is upgraded or the selected profile/workflows change
- **THEN** `openspec update` regenerates the OpenSpec-managed instruction files from the installed CLI and current configuration
- **AND** the generated files contain the selected workflow set and current tool-specific references
- **AND** the command does not modify product source code, existing OpenSpec specs, or unrelated change artifacts

#### Scenario: Generated files are regenerated rather than hand-edited

- **WHEN** a project policy or tool invocation needs to change
- **THEN** the durable policy is updated in OpenSpec configuration or other repository-owned policy sources
- **AND** the affected OpenSpec adapter files are regenerated
- **AND** unrelated custom skills and instructions are preserved

### Requirement: Third-party skills use source-based lifecycle management

Third-party skills SHALL be installed from an explicit source and skill selector through `npx skills`; the repository SHALL NOT treat manually copied third-party skill directories as its source of truth.

#### Scenario: The UI/UX skill is removed from the repository

- **WHEN** this change is implemented
- **THEN** the repository contains no project-local `ui-ux-pro-max` copies under `.codex/skills`, `.cursor/skills`, or `.claude/skills`
- **AND** `ui-ux-pro-max` is not installed by default

#### Scenario: A developer explicitly installs UI/UX Pro Max

- **WHEN** a developer chooses to use the UI/UX skill
- **THEN** the documented command identifies `nextlevelbuilder/ui-ux-pro-max-skill` as the source
- **AND** it selects only `ui-ux-pro-max` rather than installing the entire repository skill collection
- **AND** it names the target agents explicitly or uses a documented all-agent option

#### Scenario: Codex skill management is not confused with project adapters

- **WHEN** a developer runs `chc codex skills`
- **THEN** the command continues to manage only its existing Codex user-scope, manifest-backed GitHub skill lifecycle
- **AND** it does not import or remove OpenSpec-generated project adapters

### Requirement: Reasonix configuration matches the installed runtime

The repository SHALL use the configuration and project skill-discovery paths supported by the installed Reasonix release and SHALL NOT store machine-specific user paths or personal permission state in project configuration.

#### Scenario: Legacy Reasonix configuration is removed

- **WHEN** the AI tooling migration is complete
- **THEN** the repository does not rely on `reasonix.toml`
- **AND** any retained project-level Reasonix settings use the supported `.reasonix/` JSON configuration format
- **AND** no configuration value contains a workstation-specific absolute path

#### Scenario: Reasonix discovers the shared OpenSpec skills

- **WHEN** Reasonix starts in the repository after setup
- **THEN** its project skill inventory includes the shared `.agents/skills/openspec-*` workflows
- **AND** the documentation gives the correct Reasonix invocation form

#### Scenario: Desktop session metadata is not treated as shared configuration

- **WHEN** repository state is checked for Reasonix files
- **THEN** local desktop topic/session metadata is either removed from version control or explicitly classified as generated local state
- **AND** it is not described as part of the portable AI tooling contract

### Requirement: AI tooling documentation matches the repository

The repository SHALL document the actual AI tooling directories, installation commands, invocation forms, generated-file policy, and validation checks for Codex, Cursor, OpenCode, and Reasonix.

#### Scenario: Directory ownership is documented

- **WHEN** a developer reads the root agent policy, OpenSpec configuration, or AI tooling reference
- **THEN** the documentation distinguishes canonical sources from generated `.agents/`, `.cursor/`, `.opencode/`, `.codex/`, `.claude/`, and `.reasonix/` state
- **AND** it identifies which files must not be hand-edited

#### Scenario: Tool invocation is documented

- **WHEN** a developer wants to start an OpenSpec workflow
- **THEN** the documentation provides the correct native invocation for Codex, Cursor, OpenCode, and Reasonix
- **AND** it does not present a command from one tool as if it were supported by all tools

#### Scenario: Setup is repeatable

- **WHEN** a developer clones the repository or changes the selected tools
- **THEN** the documentation provides an idempotent setup path for installing the selected OpenSpec adapters
- **AND** a second run does not create duplicate skill entries or unrelated configuration changes

### Requirement: AI tooling setup is verifiable

The repository SHALL provide read-only checks that confirm OpenSpec health, generated-path ownership, skill discovery, and the absence of excluded or stale project configuration.

#### Scenario: OpenSpec health is checked

- **WHEN** a developer runs the documented AI tooling verification
- **THEN** it checks `openspec doctor` and reports the resolved OpenSpec root
- **AND** it checks that the configured workflow artifacts match the selected profile

#### Scenario: All four agent surfaces are checked

- **WHEN** verification runs after setup
- **THEN** it checks the Codex, Cursor, OpenCode, and shared `.agents` OpenSpec surfaces
- **AND** it checks that Reasonix can see the shared skills
- **AND** it reports missing or stale generated files without silently repairing them

#### Scenario: Business plugin scope is checked

- **WHEN** verification reports changed or generated AI files
- **THEN** it confirms that `codex/plugins/cthu-codex` was not modified by the project-level setup
- **AND** any difference in that plugin remains an explicit, separately scoped change
