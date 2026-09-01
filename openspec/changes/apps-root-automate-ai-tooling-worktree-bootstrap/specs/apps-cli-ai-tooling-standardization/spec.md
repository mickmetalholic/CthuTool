## ADDED Requirements

### Requirement: Standard Git worktrees bootstrap generated AI tooling

The repository SHALL initialize its ignored OpenSpec adapter surfaces after a standard Git checkout when those surfaces are missing or stale, using the same durable setup command regardless of which AI tool or developer created the worktree.

#### Scenario: New worktree receives generated adapters

- **WHEN** `git worktree add` completes a standard checkout with repository hooks enabled
- **AND** the documented OpenSpec prerequisite is available
- **THEN** the checkout bootstrap verifies the generated AI tooling state
- **AND** it runs the idempotent AI tooling setup when verification reports missing or stale adapters
- **AND** the resulting worktree contains the required OpenSpec workflows under `.agents/skills`, `.cursor/skills`, and `.opencode/skills`

#### Scenario: Bootstrap is independent of the initiating tool

- **WHEN** a worktree is created by Codex, Cursor, OpenCode, another AI host, or a developer through standard Git worktree creation
- **THEN** bootstrap behavior is selected by the repository Git lifecycle rather than an AI-host-specific environment configuration
- **AND** every initiator receives the same generated adapter contract

#### Scenario: Valid generated state is not regenerated

- **WHEN** checkout bootstrap verifies that the required generated adapters are already valid
- **THEN** it exits successfully without regenerating those adapters
- **AND** it does not modify unrelated ignored files or the protected business plugin

### Requirement: Hook installation can initialize the current checkout

The repository hook installer SHALL attempt the same AI tooling verification and repair for the checkout in which hooks are installed when the documented OpenSpec prerequisite is available.

#### Scenario: Fresh clone is initialized during dependency setup

- **WHEN** a developer installs dependencies in a fresh local clone with lifecycle scripts enabled
- **AND** the documented OpenSpec prerequisite is available
- **THEN** hook installation activates the tracked hooks
- **AND** it verifies and repairs the current checkout's generated OpenSpec adapters

#### Scenario: Missing prerequisite is actionable

- **WHEN** automatic bootstrap cannot run because the required OpenSpec command, version, profile, or delivery configuration is unavailable
- **THEN** it reports that AI tooling initialization is incomplete
- **AND** it identifies the prerequisite or repair command the developer must run
- **AND** it does not modify `codex/plugins/cthu-codex`

### Requirement: Automatic bootstrap exceptions are documented

The repository SHALL document the Git and package-manager options that intentionally bypass automatic bootstrap and SHALL provide a manual recovery command for the affected checkout.

#### Scenario: Worktree checkout is intentionally suppressed

- **WHEN** a worktree is created with `git worktree add --no-checkout`
- **THEN** documentation states that `post-checkout` does not run automatically
- **AND** it directs the developer to complete checkout and run the documented AI tooling setup manually

#### Scenario: Package lifecycle scripts are intentionally suppressed

- **WHEN** dependency installation uses an option such as `--ignore-scripts`
- **THEN** documentation states that repository hook installation and current-checkout bootstrap are skipped
- **AND** it provides explicit commands to install the hooks and regenerate the adapters
