## Why

The current Obsidian agents proposal adds a private Git repository and Codex
before/after Hooks solely because Obsidian Sync excludes the hidden `.agents`
directory. A visible vault directory plus a machine-local `.agents` directory
link can use Obsidian Sync directly and remove most synchronization machinery.

## What Changes

- Replace the unmerged Git-backed `.agents` synchronization design with a
  visible `<vault>/Agent` directory that contains shared `skills/`, `state/`,
  and related files.
- Create a machine-local `<vault>/.agents` directory link that targets
  `<vault>/Agent`, allowing agents to discover `<vault>/.agents/skills` while
  Obsidian Sync synchronizes the visible source directory.
- Keep interactive `chc obsidian agents setup` for selecting or changing the
  vault, safely migrating existing content, and creating or repairing the
  platform-appropriate directory link.
- Keep read-only `chc obsidian agents status` for reporting configuration,
  source-directory health, link health, and migration issues.
- Remove the private Git remote, fetch/commit/push workflow, synchronization
  locks, before/after sync phases, and CthuCodex synchronization Hooks from the
  proposed feature.
- Document that synchronization is eventually consistent and recommend
  conflict-resistant state layouts when multiple machines may write state
  concurrently.

## Capabilities

### New Capabilities

- `apps-cli-obsidian-agents-link`: Interactive setup, safe migration,
  machine-local vault link management, and read-only status for an
  Obsidian-synchronized Agent directory.

### Modified Capabilities

None.

## Impact

- `apps/cli`: simplify the Obsidian agents command surface and replace Git
  synchronization services with directory/link setup, migration, validation,
  and status logic.
- `codex/plugins/cthu-codex`: remove the unmerged Obsidian agents sync adapter
  and Hook registration while preserving unrelated Hooks.
- `openspec/changes/add-obsidian-agents-auto-sync`: remains historical context;
  this change supersedes its unmerged design and implementation.
- User machines: each machine keeps its own `<vault>/.agents` link, while
  Obsidian Sync transports only the real `<vault>/Agent` contents.
