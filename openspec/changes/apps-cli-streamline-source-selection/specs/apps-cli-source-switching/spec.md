## ADDED Requirements

### Requirement: Streamlined source command group

The CLI SHALL expose a public `source` command group with `list`, `use`, and `register` operations that share one source discovery and selector-resolution model. The public command group SHALL NOT expose a separate `current` operation because `list` already identifies the active source and `status` provides installation diagnostics.

#### Scenario: Bare source group is invoked

- **WHEN** a user runs `chc source` or `chc source --help`
- **THEN** the CLI renders help containing `list`, `use`, and `register`
- **AND** the help does not contain `current`
- **AND** it exits without changing the global installation, Git state, or source registry

#### Scenario: Available sources are listed

- **WHEN** a user runs `chc source list`
- **THEN** the CLI lists the active source, the default managed source, the registered main checkout, and every currently discoverable linked worktree
- **AND** each candidate reports its stable selector, kind, path, availability, and bundle state

#### Scenario: Interactive source selection

- **WHEN** an interactive TTY user runs `chc source use` without a selector
- **THEN** the CLI prompts with actionable candidates from the same discovery provider used by list and completion
- **AND** a missing managed source remains selectable and is identified as requiring installation
- **AND** no source is changed until the user makes an explicit selection

#### Scenario: Non-interactive selection is incomplete

- **WHEN** a non-interactive, JSON, or `--no-interactive` caller runs `chc source use` without a selector
- **THEN** the command fails with `missing_required_argument`
- **AND** it does not prompt or mutate global installation state

#### Scenario: Removed current operation is invoked

- **WHEN** a user runs `chc source current`
- **THEN** the CLI reports the normal unknown-operation error
- **AND** help and shell completion direct users to `source list` or `status` instead
- **AND** it does not mutate global installation or registry state

### Requirement: Automatic managed source provisioning

Selecting `remote` SHALL provision the default managed source only when that checkout is genuinely absent. An existing managed source SHALL remain a local relink operation, while an existing invalid path SHALL never be overwritten or repaired implicitly.

#### Scenario: Existing managed source is selected

- **WHEN** the default managed checkout and its committed CLI bundle exist
- **AND** the user selects `remote`
- **THEN** the CLI relinks the global command to the existing managed checkout
- **AND** it performs no fetch, checkout, ref change, or managed update

#### Scenario: Missing managed source is selected

- **WHEN** the default managed checkout path does not exist
- **AND** the user selects `remote` directly or from the interactive selector
- **THEN** the CLI reuses the safe managed install flow to create and validate the checkout
- **AND** it relinks the global command only after the committed bundle and installed target are verified

#### Scenario: Existing managed path is invalid

- **WHEN** the default managed path exists but is not a valid CthuTool Git checkout or lacks the committed CLI bundle
- **AND** the user selects `remote`
- **THEN** the command fails with actionable repair or update guidance
- **AND** it does not clone over, delete, fetch, check out, or otherwise mutate that path
- **AND** it does not change the global command

#### Scenario: Automatic managed installation fails

- **WHEN** cloning, safe checkout preparation, bundle validation, global installation, or postcondition verification fails while provisioning a missing managed source
- **THEN** the command exits non-zero with bounded recovery guidance
- **AND** it does not claim that remote is active or replace the previously active global source

#### Scenario: Removed bootstrap option is supplied

- **WHEN** a user runs `chc source use remote --bootstrap`
- **THEN** the CLI rejects the retired option through normal argument validation before source mutation
- **AND** existing managed sources continue to be updated only through the dedicated `chc update` workflow

## MODIFIED Requirements

### Requirement: Structured source output and errors

Source commands SHALL follow the shared CLI interactivity, quiet, JSON stdout, diagnostics, and stable error contracts. Human source inventories and interactive choices SHALL derive from a shared presentation model without changing canonical machine-readable source data.

#### Scenario: Human source list succeeds

- **WHEN** a user runs `chc source list` in human-output mode
- **THEN** each candidate emphasizes its selector, source kind, ref when applicable, and one clear state such as active, ready, not installed, or unavailable
- **AND** paths under the user's home directory are displayed with a `~` prefix on a secondary line
- **AND** a missing managed source is described once as not installed with an actionable installation message rather than as multiple internal availability failures

#### Scenario: Interactive source choices are rendered

- **WHEN** an interactive user runs `chc source use` without a selector
- **THEN** candidate labels use the same selector, kind, ref, and state terminology as the human source list
- **AND** the remote choice explains that selection will install it when the managed checkout is missing

#### Scenario: JSON source list succeeds

- **WHEN** a user runs `chc source list --json`
- **THEN** stdout contains exactly one success object with `command: "source list"`, the active source, and structured candidates
- **AND** canonical paths, bundle state, availability, reasons, and other structured candidate fields are not replaced by human abbreviations
- **AND** diagnostics and unavailable-source warnings remain off stdout

#### Scenario: JSON source switch succeeds

- **WHEN** a user runs `chc source use <selector> --json` and switching or missing-managed provisioning succeeds
- **THEN** stdout contains exactly one success object identifying the previous and selected canonical sources

#### Scenario: Source operation fails

- **WHEN** discovery, validation, locking, managed provisioning, npm relink, or postcondition verification fails
- **THEN** the command returns a stable source error code and non-zero exit status
- **AND** human and JSON output contain bounded actionable recovery context

#### Scenario: Quiet source operation runs

- **WHEN** a user supplies `--quiet`
- **THEN** nonessential source metadata and progress are suppressed
- **AND** failures remain visible through the shared command error contract

### Requirement: Source discovery and recovery are documented

The CLI SHALL expose source operations through help and shell completion and SHALL document development bundle, automatic managed provisioning, update separation, and ephemeral-worktree recovery behavior.

#### Scenario: Root discovery includes source

- **WHEN** a user views root help or requests root shell completion candidates
- **THEN** `source` is included as a public top-level command

#### Scenario: Source operation completion is requested

- **WHEN** a user requests completion after `chc source`
- **THEN** candidates include `list`, `use`, and `register`
- **AND** candidates do not include the removed `current` operation

#### Scenario: Dynamic source completion is requested

- **WHEN** a user requests completion for the selector after `chc source use`
- **THEN** candidates include `local`, `remote`, `.`, and currently discovered available worktree ids
- **AND** discovery failures do not prompt or emit noisy diagnostics

#### Scenario: Managed source lifecycle is documented

- **WHEN** a user reads the CLI source-switching documentation
- **THEN** it explains that selecting a missing remote installs it automatically
- **AND** it explains that selecting an existing remote only relinks and that `chc update` remains the update workflow
- **AND** it explains that an existing invalid managed path is not overwritten automatically

#### Scenario: Worktree source lifecycle is documented

- **WHEN** a developer reads the CLI source-switching documentation
- **THEN** it explains that source switching does not build or update a worktree
- **AND** it shows how to refresh `apps/cli/dist/index.js`
- **AND** it instructs the developer to switch away before deleting an active worktree

#### Scenario: Active worktree was removed

- **WHEN** the globally linked worktree has already been deleted and `chc` can no longer start
- **THEN** the documentation provides the public Bash and PowerShell remote installer commands as the recovery path

## REMOVED Requirements

### Requirement: Source command group

**Reason**: The command group included a redundant `current` operation even though `source list` already marks and returns the active source and `status` provides installation diagnostics.

**Migration**: Human callers use `chc source list` or `chc status`; JSON callers read the top-level `active` object from `chc source list --json`.

### Requirement: Predictable managed source selection

**Reason**: Requiring a separate `--bootstrap` flag made an explicitly selected but missing remote disappear from interactive selection and split one user intent across two command forms.

**Migration**: Use `chc source use remote`; it installs only when the managed checkout is absent and otherwise performs a local relink. Use `chc update` to update an existing managed checkout.
