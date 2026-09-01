## Purpose

Connect the repository-owned CthuCodex plugin to the Obsidian agents sync
workflow so configured Skill turns pull safe updates before work and publish
Skill or state changes after the turn without hardcoded machine paths.

## ADDED Requirements

### Requirement: Portable Obsidian agents Hook registration

The CthuCodex plugin SHALL register the Obsidian agents synchronization Hook
through its repository-owned portable Hook configuration and SHALL preserve the
existing language-coach Hook behavior.

#### Scenario: Plugin install materializes the sync Hook

- **WHEN** the user runs `chc codex install` for the enabled CthuCodex plugin
- **THEN** the installed Hook command points to the plugin's sync adapter through the portable plugin-root convention
- **AND** the command contains no machine-specific vault path or hardcoded user directory
- **AND** the existing language-coach Hook remains registered

### Requirement: Pre-Skill synchronization Hook

The plugin SHALL invoke the CLI before an explicitly requested managed Skill
turn so the Skill starts from a safely reconciled `.agents` repository.

#### Scenario: Explicit managed Skill invocation is prepared

- **WHEN** a user prompt explicitly invokes a Skill managed by the configured `.agents` repository
- **THEN** the prompt Hook invokes the CLI synchronization before the Skill work proceeds
- **AND** a successful synchronization allows the prompt to continue

#### Scenario: Missing setup blocks an explicitly managed Skill

- **WHEN** an explicitly requested managed Skill has no valid local profile
- **THEN** the Hook reports that setup is required
- **AND** it points to `chc obsidian agents setup`
- **AND** it does not allow the Skill to proceed as if synchronization had succeeded

#### Scenario: Ordinary prompt does not incur a repository sync

- **WHEN** a prompt does not explicitly invoke a managed Skill
- **THEN** the prompt Hook returns without changing the `.agents` repository
- **AND** it does not perform a network Git operation solely because an ordinary prompt was submitted

### Requirement: End-of-turn synchronization Hook

The plugin SHALL invoke the after-phase synchronization at the end of a Codex
turn and SHALL publish changed `.agents` content as one combined commit-and-push
operation.

#### Scenario: Turn ends without agents changes

- **WHEN** the end-of-turn Hook runs and the configured `.agents` worktree is unchanged
- **THEN** the Hook completes successfully without creating a commit or push

#### Scenario: Turn ends with Skill or state changes

- **WHEN** the end-of-turn Hook runs and Skills, references, or `state/` files changed
- **THEN** the Hook invokes the CLI after phase
- **AND** the CLI commits and pushes the changes before the Hook completes successfully

#### Scenario: End-of-turn sync fails

- **WHEN** the after-phase synchronization cannot commit or push changes
- **THEN** the Hook reports the failure and its recovery reason
- **AND** it does not silently report a successful synchronized turn
- **AND** it preserves the local changes for later recovery

### Requirement: Hook input and execution portability

The sync adapter SHALL consume the Codex Hook JSON input, resolve the configured
profile through the local CthuTool configuration store, and delegate Git policy
to the CLI synchronization operation.

#### Scenario: Hook resolves a configured profile

- **WHEN** the adapter receives valid Hook input and a configured default profile exists
- **THEN** it passes the phase and Hook context to the CLI without requiring the current Codex working directory to equal the Obsidian vault
- **AND** it does not infer or persist an absolute path from the prompt itself

#### Scenario: Adapter receives malformed input

- **WHEN** the Hook adapter receives malformed or incomplete JSON
- **THEN** it returns a structured failure suitable for Codex Hook handling
- **AND** it does not execute Git against an unverified directory
