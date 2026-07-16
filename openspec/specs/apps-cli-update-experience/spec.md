# apps-cli-update-experience Specification

## Purpose
TBD - created by archiving change apps-cli-update-experience. Update Purpose after archive.
## Requirements
### Requirement: Update Preflight Classification
The CLI SHALL inspect the resolved installed source and selected target before changing the checkout worktree or global installation.

#### Scenario: Managed install required
- **WHEN** an explicitly selected managed install directory has no Git checkout
- **THEN** preflight classifies the operation as `install_required`
- **AND** identifies the selected repository, ref, and install directory

#### Scenario: Update available
- **WHEN** the selected checkout is safe to update, contains a valid target bundle, and its current commit differs from the resolved target commit
- **THEN** preflight classifies the operation as `update_available`
- **AND** reports the current and exact target commit identities and bounded change count when available

#### Scenario: Already current
- **WHEN** the selected checkout already resolves to the target commit
- **THEN** preflight classifies the operation as `up_to_date`
- **AND** the update command exits successfully without checking out files or reinstalling the global command

#### Scenario: Local-linked default source is blocked
- **WHEN** the runtime source is outside the default managed directory
- **AND** no install-directory override is present
- **THEN** preflight classifies the operation as `blocked` with block kind `local_linked_source`
- **AND** performs no remote fetch or checkout mutation

#### Scenario: Dirty checkout is blocked
- **WHEN** an existing selected checkout has tracked or untracked worktree changes
- **THEN** preflight classifies the operation as `blocked`
- **AND** reports that the user must preserve or remove the local changes before retrying
- **AND** does not change the remote URL, checkout, or global installation

#### Scenario: Non-fast-forward branch is blocked
- **WHEN** the current branch cannot safely fast-forward to the resolved remote branch target
- **THEN** preflight classifies the operation as `blocked`
- **AND** does not rewrite, reset, or automatically stash the checkout

#### Scenario: Missing target bundle is blocked before checkout
- **WHEN** the resolved target commit lacks the committed CLI bundle
- **THEN** preflight blocks the operation before checkout mutation or global installation
- **AND** reports the target and missing bundle path

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
The CLI SHALL report update failures by stable phase with a concise summary, bounded redacted cause, and recovery hint while retaining the `update_failed` command error code.

#### Scenario: Local-linked source failure
- **WHEN** default update or check is invoked from a local-linked installation
- **THEN** the command identifies the local source directory
- **AND** explains the manual checkout update workflow and remote restore path
- **AND** attempts no managed update

#### Scenario: Preflight failure
- **WHEN** update prerequisites, target validation, or checkout safety checks fail
- **THEN** the command identifies the preflight phase and the blocked resource or condition
- **AND** no global installation is attempted

#### Scenario: Apply phase failure
- **WHEN** clone, fetch, checkout, bundle verification, or global installation fails
- **THEN** the command identifies the failed phase
- **AND** provides a recovery hint appropriate to that phase
- **AND** exits non-zero with error code `update_failed`

#### Scenario: Default failure detail is bounded and redacted
- **WHEN** a subprocess produces lengthy output or repeats an authenticated repository URL during a failed update
- **THEN** default human and JSON errors include only bounded safe context without repository credentials
- **AND** verbose output and diagnostics remain bounded and apply the same credential redaction

### Requirement: Update Source Resolution
The CLI SHALL resolve update defaults from the checkout that provides the running command and SHALL require explicit authorization before selecting a different checkout.

#### Scenario: Managed runtime source selection
- **WHEN** the running package root is the default managed source directory
- **AND** no install-directory override is present
- **THEN** update selects that package root as its source checkout

#### Scenario: Local runtime source selection
- **WHEN** the running package root is outside the default managed source directory
- **AND** no install-directory override is present
- **THEN** update classifies the source as local-linked before any remote operation
- **AND** does not fall back to the default managed checkout

#### Scenario: Explicit directory selection
- **WHEN** `--install-dir` or `CHC_INSTALL_DIR` selects a checkout
- **THEN** update uses that directory instead of the runtime package root
- **AND** treats the selection as explicit authorization to update and globally install from that directory

#### Scenario: Installed repository selection
- **WHEN** an existing selected checkout has an `origin` remote and no repository override is present
- **THEN** update uses the existing origin URL instead of replacing it with the official default

#### Scenario: Installed ref selection
- **WHEN** an existing selected checkout has no ref override
- **THEN** update preserves its symbolic branch, deterministic exact tag, or detached commit
- **AND** does not silently switch a pinned installation to `main`

#### Scenario: Missing checkout defaults
- **WHEN** an explicitly selected checkout is absent
- **AND** repository or ref overrides are absent
- **THEN** update uses the official repository and `main` defaults for the initial managed clone

### Requirement: Update Output Credential Safety
The CLI SHALL redact repository URL userinfo from every update output and diagnostic boundary.

#### Scenario: Failed authenticated repository command
- **WHEN** a Git command fails for a repository URL containing userinfo credentials
- **THEN** human errors, JSON errors, verbose command details, phase events, and command diagnostics omit those credentials
- **AND** retain bounded host, repository path, phase, and recovery context

#### Scenario: Successful authenticated repository plan
- **WHEN** a plan or result contains a repository URL with userinfo credentials
- **THEN** human and JSON source fields contain a redacted URL
