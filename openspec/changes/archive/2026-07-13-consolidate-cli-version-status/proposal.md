## Why

`chc version` and `chc status` currently overlap because installation status already includes the CLI version, while the standard `chc --version` flag provides the lightweight version-only behavior users and scripts expect. Consolidating the documented command surface makes CLI lifecycle commands easier to understand without removing compatibility for existing `chc version` callers.

## What Changes

- Make `chc --version` the documented, completion-visible version-only entry point.
- Keep `chc status` as the documented installation diagnostic command, including the installed CLI version.
- Retain `chc version` as an undocumented compatibility alias with its existing human and JSON output contracts.
- Remove `chc version` from top-level help, shell completion candidates, and user-facing lifecycle examples.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-self-installation`: Consolidate the visible version and installation-status command surface while preserving the legacy version subcommand as a compatibility alias.
- `apps-docs-site`: Document `chc --version` and `chc status` as the canonical inspection entry points.

## Impact

- CLI command registration, help rendering, and completion candidate generation under `apps/cli`.
- CLI integration and completion tests.
- Root, package-local, and docs-site CLI documentation.
- Existing `chc version` invocations continue to work, so the change is not breaking.
