## Why

The `chc` CLI is becoming the main entry point for repository maintenance workflows, but users currently need to remember subcommands, flags, and bundled script ids manually. PowerShell and zsh completion would make the CLI easier to use interactively while keeping command behavior unchanged for agents and CI.

The current CLI uses `citty`, which does not provide shell completion generation in the installed version. The project needs a small completion layer that reuses existing command definitions and dynamic bundled script discovery.

## What Changes

- Add a `chc completion` command group that prints setup scripts for PowerShell and zsh.
- Add an internal `chc __complete` command that returns completion candidates for shell adapters.
- Generate completion candidates from the shared CLI command tree instead of maintaining static shell lists.
- Complete bundled script ids dynamically through existing script discovery.
- Document PowerShell and zsh setup in `apps/cli/README.md`.
- Add tests for script generation, command candidate generation, flag completion, and dynamic script id completion.

## Capabilities

### New Capabilities

- `apps-cli-shell-completion`: Provide PowerShell and zsh completion for the `chc` CLI.

### Modified Capabilities

- None.

## Impact

- Affects `apps/cli/src/index.ts` or a new reusable main command module so runtime execution and completion introspection share the same command tree.
- Adds completion command and domain modules under `apps/cli/src`.
- Reuses bundled script discovery for `chc scripts` completion.
- Adds unit and integration tests under `apps/cli/tests`.
- Updates `apps/cli/README.md` with shell setup instructions.
