## Why

PowerShell completion currently requires users to remember and manually edit `$PROFILE` for persistent setup. Since `chc` already generates the completion script, it should also offer a first-class way to enable or disable that persistent profile entry safely.

## What Changes

- Add `chc completion enable powershell` to persistently load `chc` completion from the current user's PowerShell profile.
- Add `chc completion disable powershell` to remove the managed persistent completion block.
- Add `chc completion status powershell` to report whether the managed completion block is installed and where it lives.
- Preserve existing script-generation commands such as `chc completion powershell` and `chc completion zsh`.
- Keep persistence management conservative: only remove CLI-managed marker blocks, never arbitrary user-authored profile lines.

## Capabilities

### New Capabilities

### Modified Capabilities
- `apps-cli-shell-completion`: Add PowerShell profile lifecycle management for persistent completion enablement.

## Impact

- Affected code: `apps/cli/src/command/completion.command.ts`, completion candidate discovery, and integration tests.
- Affected docs: `apps/cli/README.md` shell completion setup section.
- Runtime behavior: PowerShell profile file creation and edits when users explicitly run enable or disable commands.
- No new external dependencies are expected.
