## Why

The CLI already has useful human flows and partial non-interactive behavior, but the contract is spread across individual commands. A shared agent contract will let humans, agents, and CI use the same tool without prompt hangs, prose scraping, or command-specific workarounds.

## What Changes

- Add shared CLI execution context for TTY, interactivity, JSON output, and quiet output.
- Add common `--json`, `--no-interactive`, and `--quiet` behavior where supported by the CLI command surface.
- Ensure non-interactive commands never prompt and fail with usage-style errors when required input is missing.
- Add strict JSON stdout rendering for successful command results and deliberate command errors.
- Pass parsed arguments and CLI context into bundled scripts through a formal script execution boundary.
- Migrate `scripts`, `convert-to-cbz`, and `codex-plugins` as the first commands/scripts proving the contract.
- Update CLI README and command authoring guidance with human and agent usage examples.

## Capabilities

### New Capabilities

- `cli-agent-contract`: Shared command execution contract for interactivity, JSON output, quiet output, and command error rendering.
- `bundled-script-execution`: Deterministic `scripts` command behavior and bundled script invocation with parsed arguments and context.
- `codex-plugin-management`: Agent-friendly status and install/update behavior for the `codex-plugins` command.

### Modified Capabilities

- None.

## Impact

- Affected code includes `apps/cli/src/index.ts`, command definitions under `apps/cli/src/command/`, bundled script execution under `apps/cli/src/flow/`, `convert-to-cbz` under `apps/cli/src/scripts/convert-to-cbz/`, and CLI tests under `apps/cli/tests/`.
- The bundled script default export shape gains an argument/context contract while remaining compatible during migration where practical.
- CLI stdout/stderr behavior becomes part of the command contract for JSON mode.
- Documentation updates are needed in `apps/cli/README.md` and any future command authoring notes.
