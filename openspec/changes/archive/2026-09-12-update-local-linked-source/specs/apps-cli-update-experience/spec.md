## MODIFIED Requirements

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
- **WHEN** the runtime source is outside the default managed directory and is not a Git checkout
- **AND** no install-directory override is present
- **THEN** preflight classifies the operation as `blocked` before any remote fetch
- **AND** it does not clone into that source directory or fall back to the managed checkout

#### Scenario: Local-linked default source is checked
- **WHEN** the runtime source is outside the default managed directory
- **AND** no install-directory override is present
- **THEN** preflight selects that local Git checkout and checks its resolved remote target
- **AND** it does not select or mutate the default managed checkout

#### Scenario: Dirty checkout is blocked
- **WHEN** a selected managed or separately targeted checkout has tracked or untracked changes, or a linked local checkout has tracked changes
- **THEN** preflight classifies the operation as `blocked`
- **AND** reports that the user must preserve or reconcile the local changes before retrying
- **AND** does not change the remote URL, checkout, or global installation

#### Scenario: Unrelated local untracked files are allowed
- **WHEN** the linked local checkout has only untracked files that do not conflict with the selected target
- **THEN** preflight may classify a safe update as `update_available` or `up_to_date`
- **AND** the untracked files remain unchanged

#### Scenario: Non-fast-forward branch is blocked
- **WHEN** the current branch cannot safely fast-forward to the resolved remote branch target
- **THEN** preflight classifies the operation as `blocked`
- **AND** does not rewrite, reset, or automatically stash the checkout

#### Scenario: Missing target bundle is blocked before checkout
- **WHEN** the resolved target commit lacks the committed CLI bundle
- **THEN** preflight blocks the operation before checkout mutation or global installation
- **AND** reports the target and missing bundle path

### Requirement: Actionable Update Failures
The CLI SHALL report update failures by stable phase with a concise summary, bounded redacted cause, and recovery hint while retaining the `update_failed` command error code.

#### Scenario: Local-linked source failure
- **WHEN** default update or check is invoked from a local-linked installation that is not a Git checkout
- **THEN** the command identifies the local source directory and explains that it cannot be safely updated
- **AND** attempts no clone over that directory or managed update

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
- **THEN** update selects that package root as the local-linked source for remote checking and safe update
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
