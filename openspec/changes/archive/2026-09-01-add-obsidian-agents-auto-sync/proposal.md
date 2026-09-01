## Why

Obsidian Sync does not synchronize the vault's `.agents` directory, while the
user's Codex Skills and their persisted `state/` must remain available and
consistent across machines. CthuTool should provide one guided local setup and
automatic Git synchronization around Skill work so users do not need to manage
separate commit and push commands or remember machine-specific paths.

## What Changes

- Add an interactive `chc obsidian agents setup` command that creates or edits
  the local Obsidian agents configuration, validates the vault and `.agents`
  paths, and guides private Git remote setup.
- Persist machine-specific vault and `.agents` paths under the local CthuTool
  data directory; do not store absolute local paths in the shared `.agents`
  repository.
- Add a read-only `chc obsidian agents status` command with human-readable and
  JSON output for configuration, paths, Git repository, remote, worktree,
  synchronization, and Codex Hook readiness.
- Add an internal sync operation that pulls safe remote changes before a Skill
  turn and detects, commits, and pushes `.agents` changes after the turn,
  including `state/` changes.
- Add repository-owned CthuCodex Hook integration for pre-turn and end-of-turn
  synchronization, while keeping the shared Skill and state files in the
  Obsidian `.agents` repository.
- Handle missing configuration, concurrent sync attempts, authentication
  failures, non-fast-forward updates, and merge conflicts with actionable
  diagnostics rather than silently continuing as if synchronization succeeded.

## Capabilities

### New Capabilities

- `apps-cli-obsidian-agents`: Local configuration, interactive setup and edit,
  status reporting, Git-backed `.agents` synchronization, and machine-local
  persistence for Obsidian Skill repositories.
- `codex-plugins-cthu-codex-obsidian-agents-sync`: CthuCodex Hook behavior that
  prepares the configured `.agents` repository before Skill work and finalizes
  changes after the Codex turn.

### Modified Capabilities

None.

## Impact

- `apps/cli`: new command surface, local configuration storage, Git sync domain
  logic, structured output, and tests.
- `codex/plugins/cthu-codex`: additional portable Hook command and adapter
  script, installed through the existing `chc codex install` flow.
- `openspec/specs`: two new capability specifications covering CLI behavior and
  plugin Hook behavior.
- User machines: a new CthuTool-local configuration file and a Git working tree
  under the Obsidian vault's `.agents` directory; Git credentials remain owned
  by the user's SSH or credential-manager configuration.
