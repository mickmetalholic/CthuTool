# apps-cli-update-experience Specification

## Purpose
TBD - created by archiving change apps-cli-update-experience. Update Purpose after archive.
## Requirements
### Requirement: Update Preflight Classification
The CLI SHALL inspect the selected update source and classify the intended operation before changing the checkout worktree or global installation.

#### Scenario: Managed install required
- **WHEN** the selected managed install directory has no Git checkout
- **THEN** preflight classifies the operation as `install_required`
- **AND** identifies the selected repository, ref, and install directory

#### Scenario: Update available
- **WHEN** the selected checkout is safe to update and its current commit differs from the resolved target commit
- **THEN** preflight classifies the operation as `update_available`
- **AND** reports the current and target commit identities and bounded change count when available

#### Scenario: Already current
- **WHEN** the selected checkout already resolves to the target commit
- **THEN** preflight classifies the operation as `up_to_date`
- **AND** the update command exits successfully without checking out files or reinstalling the global command

#### Scenario: Dirty checkout is blocked
- **WHEN** an existing selected checkout has tracked or untracked worktree changes
- **THEN** preflight classifies the operation as `blocked`
- **AND** reports that the user must preserve or remove the local changes before retrying
- **AND** does not change the remote URL, checkout, or global installation

#### Scenario: Non-fast-forward branch is blocked
- **WHEN** the current branch cannot safely fast-forward to the resolved remote branch target
- **THEN** preflight classifies the operation as `blocked`
- **AND** does not rewrite, reset, or automatically stash the checkout

### Requirement: Read-only Update Availability Check
The CLI SHALL provide `chc update --check` to report update availability without changing checkout files or the global installation.

#### Scenario: Check reports available update
- **WHEN** a user runs `chc update --check` and the selected target differs from the installed source commit
- **THEN** the command reports `update_available`
- **AND** exits successfully without checkout or global install phases

#### Scenario: Check reports current installation
- **WHEN** a user runs `chc update --check` and the selected target matches the installed source commit
- **THEN** the command reports `up_to_date`
- **AND** exits successfully

#### Scenario: Check reports missing managed installation
- **WHEN** a user runs `chc update --check` and the selected managed checkout is absent
- **THEN** the command reports `install_required`
- **AND** does not clone the repository

### Requirement: Adaptive Human Update Output
The CLI SHALL render update progress and results according to TTY, quiet, and verbose modes while keeping explicit safe updates direct.

#### Scenario: Interactive safe update
- **WHEN** a user runs `chc update` in an interactive TTY for a safe managed checkout with an available update
- **THEN** the command proceeds without a redundant confirmation prompt
- **AND** presents active and completed phases using TTY-safe progress rendering
- **AND** finishes with a current-to-target summary

#### Scenario: Non-TTY update output
- **WHEN** human update output is written without a TTY
- **THEN** the command writes stable plain lines without cursor control sequences or animation

#### Scenario: Already-current human output
- **WHEN** a human update invocation is already current
- **THEN** the command clearly states that `chc` is already up to date
- **AND** identifies the selected ref and commit when available

#### Scenario: Bounded change highlights
- **WHEN** an update contains one or more commits
- **THEN** default human output presents a bounded list of commit subjects
- **AND** identifies when additional commits were omitted

#### Scenario: Quiet update output
- **WHEN** a user runs an update with `--quiet`
- **THEN** nonessential source details, progress, and change highlights are suppressed
- **AND** errors remain visible

#### Scenario: Verbose update output
- **WHEN** a user runs an update with `--verbose`
- **THEN** the command includes bounded subprocess command and output details for diagnosis
- **AND** does not expose secrets or corrupt JSON stdout

### Requirement: Structured Update Results
The CLI SHALL expose stable machine-readable update states and identities while preserving the single-value JSON stdout contract.

#### Scenario: JSON update applied
- **WHEN** `chc update --json` applies an available update
- **THEN** stdout contains exactly one success JSON object with `command: "update"`
- **AND** its result includes `status: "updated"`, before and after identities, completed phases, and bounded change metadata

#### Scenario: JSON already current
- **WHEN** `chc update --json` finds no change to apply
- **THEN** stdout contains exactly one success JSON object with `status: "up_to_date"`
- **AND** no human progress is written to stdout

#### Scenario: JSON initial managed install
- **WHEN** `chc update --json` creates a previously absent managed checkout and installs the command
- **THEN** the result includes `status: "installed"` and the installed target identity

#### Scenario: JSON availability check
- **WHEN** `chc update --check --json` completes
- **THEN** stdout contains exactly one success JSON object whose result status is `install_required`, `update_available`, or `up_to_date`
- **AND** no apply-only phase is reported as completed

### Requirement: Actionable Update Failures
The CLI SHALL report update failures by stable phase with a concise summary, bounded cause, and recovery hint while retaining the `update_failed` command error code.

#### Scenario: Preflight failure
- **WHEN** update prerequisites or checkout safety checks fail
- **THEN** the command identifies the preflight phase and the blocked resource or condition
- **AND** no global installation is attempted

#### Scenario: Apply phase failure
- **WHEN** clone, fetch, checkout, bundle verification, or global installation fails
- **THEN** the command identifies the failed phase
- **AND** provides a recovery hint appropriate to that phase
- **AND** exits non-zero with error code `update_failed`

#### Scenario: Default failure detail is bounded
- **WHEN** a subprocess produces lengthy output during a failed update
- **THEN** default human and JSON errors include only bounded safe context
- **AND** direct command, cwd, and expanded output details are reserved for verbose output or diagnostics
