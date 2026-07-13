## Why

CLI execution, help rendering, shell completion, command visibility, and bare-command behavior currently derive from several separate hard-coded paths. This duplication has already allowed supported `completion` operations and dynamically discovered scripts to appear in completion without appearing in help, and it makes every new command likely to require synchronized edits across unrelated files.

## What Changes

- Introduce a shared command-discovery model for public, compatibility, and internal command visibility plus bare-command behavior.
- Derive static command help and completion candidates from the same registered Citty command tree.
- Model `completion` operations as real subcommands while preserving existing `chc completion <shell>` and `chc completion <action> <shell>` syntax.
- Add a discoverable bundled-script catalog with human and JSON listing, and use the same discovered catalog for script help, completion, interactive selection, and execution.
- Keep `chc scripts <id>` and `chc scripts --script <id>` working as compatibility-friendly shorthand for script execution.
- Define and test consistency invariants so public commands offered by completion are represented in help, while compatibility and internal commands remain callable but undiscoverable.

## Capabilities

### New Capabilities

- `apps-cli-command-discovery`: Defines the shared command registration, visibility, help, completion, and bare-command behavior contract for the CLI.

### Modified Capabilities

- `apps-cli-shell-completion`: Derive completion lifecycle actions and supported shells from the real command model instead of parallel hard-coded parsing and candidate lists.
- `apps-cli-bundled-script-execution`: Add catalog listing and consistent bare/help behavior while preserving existing script invocation syntax.

## Impact

- CLI root registration, help rendering, command dispatch, and completion candidate traversal under `apps/cli`.
- Completion lifecycle command definitions and their compatibility routes.
- Bundled-script discovery, catalog presentation, and runner entry points.
- CLI unit and integration tests, committed runtime bundle, and user-facing CLI documentation.
- No existing documented completion or script execution command is removed.
