## Purpose

Provide a guided, machine-local configuration and safe Git synchronization
workflow for an Obsidian vault's `.agents` directory, including Skills and
persisted Skill state that must be shared across machines.

## ADDED Requirements

### Requirement: Interactive Obsidian agents setup

The CLI SHALL provide `chc obsidian agents setup` as an interactive command
that creates a first configuration and edits an existing configuration without
requiring users to hand-edit JSON files.

#### Scenario: First-time setup is guided

- **WHEN** no valid Obsidian agents profile exists and the user runs `chc obsidian agents setup`
- **THEN** the command prompts for the Obsidian vault path
- **AND** it proposes the vault's `.agents` directory as the default agents path
- **AND** it validates the selected paths before saving configuration
- **AND** it guides Git repository and private remote setup when they are not already configured
- **AND** it shows the initial mutation and requires confirmation before initializing, committing, or pushing files

#### Scenario: Existing setup can be edited

- **WHEN** a valid profile exists and the user runs `chc obsidian agents setup`
- **THEN** the command displays the current profile and offers to keep it or edit its vault path, agents path, Git remote, or default selection
- **AND** it validates the replacement values before applying them
- **AND** it does not delete or move the old agents directory merely because a path was changed

#### Scenario: Non-interactive setup is explicit

- **WHEN** the user combines setup with non-interactive or JSON execution
- **THEN** the command does not prompt
- **AND** it requires explicit values for every missing setup decision
- **AND** it returns one parseable structured result describing the saved profile or the validation error

### Requirement: Machine-local profile persistence

The CLI SHALL persist Obsidian agents profiles under the platform's local
CthuTool data directory and SHALL keep machine-specific absolute paths out of
the shared `.agents` working tree.

#### Scenario: Profile is persisted locally

- **WHEN** setup completes successfully
- **THEN** the selected vault and agents paths are written to the local CthuTool configuration store
- **AND** a default profile is selected when one does not already exist
- **AND** the configuration write is atomic so an interrupted write cannot leave an unreadable configuration

#### Scenario: Shared repository does not receive local secrets or paths

- **WHEN** the CLI manages the `.agents` Git repository
- **THEN** it does not write the machine-local configuration file into `.agents`
- **AND** it does not write SSH private keys, access tokens, or credential-manager secrets into the repository
- **AND** the repository continues to contain the Skill and state files intended for cross-machine synchronization

### Requirement: Git repository bootstrap and remote safety

The setup and synchronization workflow SHALL manage only the configured
`.agents` repository and SHALL never force-push or discard local files during
bootstrap or reconciliation.

#### Scenario: Existing local agents files are initialized

- **WHEN** the selected `.agents` directory contains files but is not yet a Git repository
- **THEN** setup preserves the files, initializes the repository, and presents the files and remote action in the confirmation preview
- **AND** it includes `state/` changes in the normal repository scope
- **AND** it creates the initial commit and push only after explicit confirmation

#### Scenario: Non-fast-forward or conflicting remote is detected

- **WHEN** local and remote histories cannot be reconciled by a fast-forward update or a safe push
- **THEN** synchronization stops without force-pushing, resetting, or deleting files
- **AND** the command reports the local repository path and an actionable conflict or recovery message

### Requirement: Read-only status reporting

The CLI SHALL provide `chc obsidian agents status` as a non-interactive status
view for the selected profile.

#### Scenario: Status reports a healthy configured profile

- **WHEN** the selected profile, paths, Git repository, remote, and worktree are valid
- **THEN** status reports the profile name, vault path, agents path, branch, remote, worktree cleanliness, synchronization relationship, and Codex Hook readiness
- **AND** the human-readable output is concise and grouped by check
- **AND** `--json` returns stable machine-readable fields for the same checks

#### Scenario: Status reports missing configuration

- **WHEN** no profile is configured
- **THEN** status exits without prompting or modifying files
- **AND** it clearly reports that setup is required
- **AND** it points to `chc obsidian agents setup`

#### Scenario: Status does not mutate by default

- **WHEN** the user runs status without a refresh option
- **THEN** it does not commit, push, pull, or modify the working tree
- **AND** any cached remote comparison is labeled as such

#### Scenario: Status can refresh remote comparison

- **WHEN** the user runs status with an explicit remote refresh option
- **THEN** the command fetches remote metadata without changing tracked working files
- **AND** it reports the resulting ahead, behind, diverged, or unavailable state

### Requirement: Combined before-and-after synchronization

The CLI SHALL provide a synchronization operation used by Hooks and diagnostics
that combines Git actions into a single safe workflow rather than requiring
separate user-facing commit and push commands.

#### Scenario: Before-turn synchronization prepares a clean repository

- **WHEN** the before phase runs for a configured profile
- **THEN** it acquires the profile's synchronization lock
- **AND** it fetches remote metadata
- **AND** it fast-forwards a clean local branch when the remote is ahead
- **AND** it does not discard local uncommitted or committed work
- **AND** it stops before Skill work when the repository is conflicted, diverged, or cannot be safely synchronized

#### Scenario: After-turn synchronization publishes changes

- **WHEN** the after phase runs after Skill work
- **THEN** it inspects only the configured `.agents` repository
- **AND** it returns successfully without a commit when there are no changes
- **AND** it stages and commits changed Skills, references, and `state/` files as one synchronization unit
- **AND** it pushes the commit to the configured remote
- **AND** it reports the commit and push result

#### Scenario: Push failure preserves recoverable work

- **WHEN** an after-phase commit succeeds but the push fails
- **THEN** the local commit remains intact
- **AND** the command reports that the repository is locally ahead or otherwise unsynchronized
- **AND** a later before or manual sync can retry without recreating or losing the commit

### Requirement: Synchronization locking and failure visibility

The CLI SHALL serialize synchronization for each profile and SHALL expose
failures instead of silently treating an incomplete sync as successful.

#### Scenario: Concurrent phases share one lock

- **WHEN** two sync operations target the same profile concurrently
- **THEN** only one operation mutates or pushes the repository at a time
- **AND** the other operation waits within a bounded period or exits with a busy status
- **AND** the worktree is not left with interleaved Git operations

#### Scenario: Authentication or network failure is reported

- **WHEN** Git authentication, fetch, or push fails
- **THEN** the command returns a non-success result
- **AND** it reports the affected phase and repository without exposing credentials
- **AND** it does not claim that the profile is synchronized
