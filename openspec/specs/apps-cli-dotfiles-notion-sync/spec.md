# apps-cli-dotfiles-notion-sync Specification

## Purpose

Publish complete Notion-authored software, toolset, and host definitions as reviewed Git snapshots through direct API reads, preventing partial reads or outdated data models from silently changing machine behavior.

## Requirements

### Requirement: Notion synchronization uses only the direct API
`chc dotfiles notion diff` and `pull` SHALL read the configured software, toolset, and host data sources through the Notion API. They SHALL use shared Token resolution and SHALL NOT require or accept a connector, connector-export snapshot, or mode-selection flag. The synchronization interface SHALL perform no Notion writes.

#### Scenario: Running outside an agent application
- **WHEN** the user invokes notion diff with valid API credentials in a normal terminal
- **THEN** all required data is retrieved without a Codex or ChatGPT connector

### Requirement: Complete validated reads precede export
Synchronization SHALL validate source schemas, retrieve all query pages and all paginated relation properties, and normalize into the same versioned model consumed by runtime commands. It MUST preserve every supported runtime field and reject malformed structured values, duplicate stable keys, dangling relations, or unknown/conflicting model fields before publishing a new candidate snapshot. Restoring a previous generation after an interrupted transaction SHALL be handled by pull's internal recovery before a new publication attempt. Rate-limit retries SHALL be bounded and respect the API's retry guidance.

#### Scenario: Reading a relation beyond its first page
- **WHEN** a toolset or host relation is truncated in the initial API response
- **THEN** synchronization retrieves the remaining relation pages before resolving the plan

#### Scenario: A later page fails
- **WHEN** a later data or relation page cannot be retrieved after bounded retries
- **THEN** synchronization fails without producing a partial snapshot
- **AND** the previous published files remain unchanged

### Requirement: Lifecycle and page identity are guarded
Active rows SHALL participate in export; drafts SHALL be excluded without requiring complete active-row configuration. Retired rows SHALL require explicit acknowledged retirement before removing published identities. The system MUST retain page-ID-to-stable-key continuity in a non-secret manifest, reject unexplained disappearance or identity changes, and require a reviewed migration mapping for intentional key changes. Missing API visibility or changing a published row to draft MUST NOT be interpreted as deletion.

#### Scenario: An incomplete draft exists
- **WHEN** a draft row lacks installation information
- **THEN** it is excluded without preventing an otherwise valid active export

#### Scenario: A previously published page disappears
- **WHEN** a published page is absent or changes stable ID without a reviewed migration mapping
- **THEN** notion diff and pull report an identity/visibility conflict
- **AND** pull does not remove or rename the published item

#### Scenario: A host is deliberately retired
- **WHEN** a published host is explicitly retired and the pull invocation acknowledges that retirement
- **THEN** its removal is shown in the diff and reflected in the identity manifest
- **AND** local machines bound to it subsequently receive an actionable missing-host error

### Requirement: Configuration diff is a review operation
`notion diff` SHALL report schema problems, drift, additions, updates, and guarded removals without changing repository snapshots, Notion, installed software, or home configuration. A newly validated credential SHALL be cached only through the shared first-authentication flow. Human and JSON output SHALL distinguish valid differences from validation or authentication failures.

#### Scenario: Reviewing legitimate differences
- **WHEN** API data is valid but differs from the published snapshot
- **THEN** notion diff returns a reviewable difference report
- **AND** repository files and system configuration are unchanged

### Requirement: Pull publishes deterministic local files transactionally
`notion pull` SHALL write only allowlisted generated software/toolset/host YAML and the identity manifest after the entire candidate snapshot passes validation. Relation membership SHALL be order-insensitive; unchanged membership MUST preserve existing published ordering and newly added members MUST have deterministic ordering. Failure during replacement SHALL preserve or recover the previous complete generation and MUST NOT expose a partially accepted snapshot to runtime commands.

#### Scenario: API order changes without semantic changes
- **WHEN** API row or relation ordering changes but configuration does not
- **THEN** repeated pull produces identical published bytes without unrelated reorder diffs

#### Scenario: File publication fails
- **WHEN** replacing one generated file fails
- **THEN** pull fails with recovery information and the previous complete generation remains usable
- **AND** a partially written generation cannot be used for setup

### Requirement: Publication and machine application remain separate
Synchronization SHALL stop after the local diff or export. It SHALL NOT commit, push, update another checkout, invoke setup/apply, or install packages. Documentation SHALL describe Notion edit → notion diff/pull → Git review/publication → machine source update → explicit setup/apply.

#### Scenario: Exporting a software addition
- **WHEN** pull adds a newly active software item to the local snapshot
- **THEN** the change remains available for Git review
- **AND** the software is not installed until a separately requested setup

### Requirement: Pull handles interrupted local synchronization internally
Pull SHALL roll back failed publication and, on a subsequent invocation, safely restore a previous complete generation from validated local recovery material before starting a new export. This local recovery phase SHALL NOT access Notion or require a Token. It SHALL respect the source lock, reject an active writer or conflicting user edits, and retain backups with actionable manual-resolution information if safe restoration is not possible. No standalone recovery command SHALL be exposed. Recovery SHALL NOT uninstall software or restore home configuration.

#### Scenario: Retrying an interrupted export
- **WHEN** an interrupted pull has a valid recoverable previous generation and the user invokes pull again
- **THEN** the previous complete snapshot is restored and validates successfully
- **AND** the local restoration finishes without Notion access before the new export's authentication and read steps
- **AND** no home change occurs

#### Scenario: Recovery conflicts with newer edits
- **WHEN** local generated files have been edited after the interrupted transaction
- **THEN** recovery reports the conflict and preserves the journal and backups
- **AND** it does not overwrite the newer user edits
