## Why

Agents can discover the six public `chc` groups but cannot discover conversion options from script help, and obsolete Agent instructions conflict with the current native self-use flow. CthuCodex needs a portable usage skill that turns user goals into supported CLI operations without assuming a source checkout or expanding authorization.

## What Changes

- Add read-only script-specific help from optional bundled manifest metadata, including conversion flags, defaults, prerequisites, and examples.
- Hide the deprecated Agent environment entry from public help and completion while preserving its migration error.
- Align Agent documentation and the conflicting Web-settings requirement with native settings and the latest self-use release.
- Add the discoverable `cthutool-cli` skill to CthuCodex with command selection, JSON/non-interactive operation, scoped workflows, and verification guidance.
- Keep sample scripts and compatibility execution forms. Restore development dependencies from the existing lockfile for verification and refresh the committed CLI bundle.

## Capabilities

### New Capabilities

- `codex-plugins-cthu-codex-cli-skill`: Portable agent guidance for operating the installed CthuTool CLI.

### Modified Capabilities

- `apps-cli-bundled-script-execution`: Read-only, target-specific script help using the discovered manifest catalog.
- `apps-cli-agent-lifecycle`: Reconcile the obsolete Web-settings requirement with native settings and separate Web console access.

## Impact

CLI help rendering, script manifests/catalog, Agent command registration, focused tests, the committed CLI distribution, CLI documentation, and the CthuCodex skill/docs are affected. No new runtime dependencies, MCP servers, public API changes, generated OpenSpec adapter edits, or neighboring-change updates are required.
