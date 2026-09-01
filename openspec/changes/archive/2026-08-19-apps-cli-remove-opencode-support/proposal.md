## Why

CthuTool currently exposes an OpenCode-specific configuration synchronizer even though its skill lifecycle manager is intentionally Codex-focused. This creates a second agent integration surface with separate configuration semantics and maintenance cost, so the OpenCode adapter should be retired and the CLI contract narrowed to supported Codex workflows.

## What Changes

- **BREAKING** Remove the public `chc opencode` command group, including its `skills` and `mcp` subcommands.
- Remove OpenCode configuration synchronization, path-resolution options, and related domain types.
- Remove OpenCode-specific command, completion, help, integration, and unit-test coverage.
- Remove OpenCode instructions from CLI, documentation, and plugin README files.
- Retire the active `apps-cli-opencode-shared-assets` capability specification and its index entry.
- Preserve Codex plugin assets and `chc codex` installation and skill-management behavior.
- Do not delete or migrate existing user OpenCode configuration files; the change only removes CthuTool's future management of them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-opencode-shared-assets`: retire the OpenCode shared-assets synchronization capability and remove its public CLI contract.

## Impact

- Affected CLI entry points: `apps/cli/src/command/root.command.ts` and the OpenCode command/configuration modules.
- Affected configuration model: OpenCode-specific fields and overrides currently carried by `codex-config-paths`.
- Affected tests and documentation covering command discovery, shell completion, global-bin help, OpenCode configuration, and plugin setup.
- The generated CLI distribution must be regenerated during implementation.
- Users invoking `chc opencode skills` or `chc opencode mcp` will need to stop using those commands; Codex commands remain available.
