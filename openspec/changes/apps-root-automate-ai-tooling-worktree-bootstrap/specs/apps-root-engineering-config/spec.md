## ADDED Requirements

### Requirement: Dependency installation configures tracked repository hooks

The root package lifecycle SHALL configure Git to use a repository-tracked hook directory after a local dependency installation, and repeated installation SHALL leave the same effective hook configuration without duplicating or rewriting hook entries.

#### Scenario: Local dependency installation activates hooks

- **WHEN** a developer runs the root dependency installation with lifecycle scripts enabled inside a Git checkout
- **THEN** the root prepare lifecycle configures `core.hooksPath` to the repository-tracked hook directory
- **AND** the configured path is shared by linked worktrees belonging to the same Git repository

#### Scenario: Hook installation is idempotent

- **WHEN** the hook installer runs more than once in the same Git repository
- **THEN** the effective `core.hooksPath` value remains the repository-tracked hook directory
- **AND** no duplicate hook configuration is created

#### Scenario: Unsupported installation context is safe

- **WHEN** the package lifecycle runs outside a Git checkout or in a documented environment where repository hooks are disabled
- **THEN** hook installation exits without mutating an unrelated Git configuration
- **AND** dependency installation is not failed solely because Git hooks are unavailable in that context

#### Scenario: Suppressed lifecycle scripts remain explicit

- **WHEN** dependencies are installed with lifecycle scripts disabled
- **THEN** automatic hook installation is not claimed to have run
- **AND** the repository documentation provides an explicit command that installs or repairs the hook configuration

### Requirement: Tracked hooks preserve repository validation behavior

The tracked hook directory SHALL preserve the repository's existing pre-commit and commit-message validation behavior and SHALL provide the checkout hook required for worktree initialization without requiring dependencies to be installed separately in each new worktree first.

#### Scenario: Existing commit checks remain active

- **WHEN** a developer commits with repository hooks enabled
- **THEN** the pre-commit hook runs the existing CLI distribution refresh and staged-file validation commands
- **AND** the commit-message hook runs the existing commit message validation command

#### Scenario: New linked worktree can run the checkout hook

- **WHEN** standard Git creates a linked worktree and completes its initial checkout
- **THEN** the tracked `post-checkout` hook is available from the files checked out into that worktree
- **AND** it does not require a generated per-worktree hook dispatcher to exist before the checkout
