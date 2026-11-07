## Why

`source use` already discovers and remembers development checkouts, making a separate registration command redundant. Remembering a failed switch can also replace a working local return path.

## What Changes

- **BREAKING**: Remove `chc source register` from execution, help, and completion; `source` exposes only `list`, `status`, `use`, and `update`.
- Remember a development checkout's owning main worktree after successful `use`, including an already-active selection; retain the local anchor after a successful managed switch.
- Preserve the registry on failed validation, locking, installation, or verification, and keep inventory/status read-only.
- Update recovery guidance, CLI documentation, the CthuCodex CLI skill, and committed bundles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-source-switching`: Remove explicit registration and define automatic registration and failure preservation through `use`.

## Impact

CLI source command routing and manager, source/completion tests, CLI README and command reference, and `codex/plugins/cthu-codex/skills/cthutool-cli`. Existing version-1 registry files remain valid. No new dependencies or generated agent adapters.
