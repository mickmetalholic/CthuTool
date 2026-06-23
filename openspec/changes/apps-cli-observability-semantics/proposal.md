## Why

The CLI already separates human output, JSON output, warnings, and diagnostics, but it does not have a complete observability vocabulary for command invocation, bundled script execution, and failure correlation. CLI observability semantics will make local debugging predictable without corrupting JSON stdout contracts.

## What Changes

- Define CLI invocation observability fields for command name, subcommand, script id, mode, duration, exit code, and stable error code.
- Define diagnostics placement rules that preserve the existing `--json` stdout contract while allowing structured warnings and diagnostics on stderr.
- Define bundled script lifecycle events for selection, argument validation, execution start, progress diagnostics, completion, and failure.
- Define quiet and non-interactive mode behavior for observability output.
- Define safe redaction rules for filesystem paths, environment-derived values, credentials, and large payloads.

## Capabilities

### New Capabilities

- `apps-cli-observability`: CLI command, bundled script, stderr diagnostics, JSON-safe, and redaction semantics.

### Modified Capabilities

- `apps-cli-agent-contract`: Shared CLI context gains observability-mode and diagnostics-output requirements while preserving JSON stdout behavior.
- `apps-cli-bundled-script-execution`: Bundled script invocation gains lifecycle diagnostics and failure correlation requirements.

## Impact

- Affects `apps/cli` command boundaries, bundled script runtime helpers, convert-to-cbz progress diagnostics, and CLI tests for stdout/stderr behavior.
- May coordinate with `packages-config-observability` for shared log level or diagnostics configuration.
- No breaking changes to existing JSON output are intended.
