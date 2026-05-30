## MODIFIED Requirements

### Requirement: Plugin workflow under codex group
The CLI SHALL expose the existing Codex plugin workflow as `chc codex plugins`.

#### Scenario: Plugin status is listed
- **WHEN** a user runs `chc codex plugins` without selecting plugins in non-interactive mode
- **THEN** the command lists discovered Codex plugin install status
- **AND** it exits successfully without installing plugins

#### Scenario: Selected plugin is installed
- **WHEN** a user runs `chc codex plugins --plugin language-coach`
- **THEN** the command installs or updates the matching personal marketplace entry using the plugin path under `codex/plugins/language-coach`

#### Scenario: Selected plugin cache is synchronized
- **WHEN** a user runs `chc codex plugins --plugin language-coach --sync-cache`
- **THEN** the command refreshes only the selected plugin in the personal Codex plugin cache

#### Scenario: Patch version is bumped before cache sync
- **WHEN** a user runs `chc codex plugins --plugin language-coach --bump-patch`
- **THEN** the command increments the selected plugin patch version before refreshing its personal Codex plugin cache
