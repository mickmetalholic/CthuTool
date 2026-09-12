## Why

`chc codex install` currently treats an unrelated working directory as the repository root. Plugin discovery then returns an empty list, and the human output says `installed plugins: (none)` without explaining the source or how to fix it.

## What Changes

- Remember the selected repository plugin source in the user's CLI configuration. Prompt for it on first interactive use and allow changing it later with `--change-source`.
- Keep `--repo-root` as a one-run override; allow `--change-source --repo-root <path>` to set the default non-interactively.
- Reject unavailable sources and missing source configuration with actionable errors in non-interactive and JSON modes.
- Show source provenance, repository path, plugin names, install actions, and cache sync results in human output. Include source metadata in JSON.
- Update CLI documentation, focused tests, and the committed CLI bundle.

## Capabilities

### Modified Capabilities

- `apps-cli-codex-plugin-management`: persistent source selection and informative installation output.

## Impact

- CLI command, source configuration, tests, docs, and committed bundle.
- No changes to the protected `codex/plugins/cthu-codex` plugin.
