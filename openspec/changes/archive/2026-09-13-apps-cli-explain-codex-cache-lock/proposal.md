## Why

When Codex has a versioned plugin cache directory open, `chc codex install` may fail with a raw `EBUSY ... rmdir` error. The message does not identify the recovery action.

## What Changes

- Recognize `EBUSY` while synchronizing a repository plugin cache and report the locked path with an instruction to exit Codex completely and rerun the install command.
- Return a structured `codex_plugin_cache_busy` error in `--json` mode, without treating unrelated filesystem failures as a Codex lock.
- Add focused regression coverage and document the recovery step.

## Capabilities

### Modified Capabilities

- `apps-cli-codex-plugin-management`: actionable cache-lock failure reporting.

## Impact

- CLI plugin cache synchronization, install command output, tests, docs, and committed CLI bundle.
- No change to the protected CthuCodex plugin source.
