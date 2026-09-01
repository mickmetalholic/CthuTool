## ADDED Requirements

### Requirement: Adaptive installation status presentation

Outside JSON and quiet modes, `chc status` SHALL render installation state as a compact, grouped summary that remains understandable when terminal color is unavailable.

#### Scenario: Interactive terminal status

- **WHEN** a user runs `chc status` with human output attached to a color-capable terminal
- **THEN** stdout groups source identity separately from installation details
- **AND** it uses lightweight decoration and semantic color to distinguish the title, installation mode, commit identity, and bundle state
- **AND** the same facts required by the existing status command remain visible

#### Scenario: Non-color status

- **WHEN** human status output is written to a non-TTY destination or color is disabled
- **THEN** stdout contains no ANSI color sequences
- **AND** section labels, textual mode, and textual bundle state preserve the meaning conveyed by color

#### Scenario: Missing bundle status

- **WHEN** the inspected source does not contain the committed CLI bundle
- **THEN** the installation section visibly distinguishes the bundle as missing
- **AND** status still reports the expected bundle path

#### Scenario: Quiet status

- **WHEN** a user runs `chc status --quiet`
- **THEN** the decorative human summary is suppressed according to the shared CLI output contract

### Requirement: Local commit metadata in installation status

When `chc status` inspects a local-mode Git checkout, it SHALL report bounded metadata describing the checked-out commit without making Git metadata availability a prerequisite for status success.

#### Scenario: Local commit metadata is available

- **WHEN** status resolves `mode: local`
- **AND** the inspected source is a Git checkout whose HEAD commit metadata can be read
- **THEN** status reports the commit's committer time as an absolute ISO 8601 value with an explicit timezone offset
- **AND** it reports the commit's sanitized, single-line subject within a bounded display length

#### Scenario: Local human commit details

- **WHEN** a user requests human-readable status for a local checkout with commit metadata
- **THEN** the source section displays the short commit hash, committer time, and subject as separately identifiable details
- **AND** the displayed time retains an explicit timezone offset

#### Scenario: Local JSON commit details

- **WHEN** a user runs `chc status --json` for a local checkout with commit metadata
- **THEN** the single structured status response includes optional `commitTime` and `commitMessage` fields
- **AND** existing status fields and the one-JSON-value stdout contract remain unchanged

#### Scenario: Remote managed status

- **WHEN** status resolves `mode: remote`
- **THEN** it does not query or report the local-only `commitTime` and `commitMessage` fields
- **AND** it continues to report the managed checkout's existing repository, ref, commit, and bundle state

#### Scenario: Local commit metadata is unavailable

- **WHEN** the inspected local source is not a Git checkout or its HEAD metadata cannot be read
- **THEN** status completes using the remaining installation facts
- **AND** it omits unavailable structured commit metadata instead of failing the command
