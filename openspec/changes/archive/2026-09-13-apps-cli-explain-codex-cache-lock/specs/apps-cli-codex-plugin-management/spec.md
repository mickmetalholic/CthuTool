## ADDED Requirements

### Requirement: Actionable plugin cache lock error

The `chc codex install` command SHALL distinguish a busy Codex plugin cache from other installation failures and explain how to finish installation safely.

#### Scenario: Cache directory is locked

- **WHEN** plugin cache synchronization fails with filesystem error `EBUSY`
- **THEN** the command identifies the busy cache path
- **AND** human output instructs the user to exit Codex completely and rerun `chc codex install`
- **AND** `--json` output contains a structured `codex_plugin_cache_busy` error

#### Scenario: Unrelated filesystem error

- **WHEN** plugin cache synchronization fails for a reason other than `EBUSY`
- **THEN** the command does not mislabel the failure as a Codex cache lock
