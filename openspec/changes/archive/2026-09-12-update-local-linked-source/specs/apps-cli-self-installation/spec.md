## MODIFIED Requirements

### Requirement: CLI Lifecycle Commands
The CLI SHALL provide canonical lifecycle entry points for viewing the installed CLI version, inspecting installation state, and safely updating the checkout that provides the running `chc` command. The discoverable interface SHALL use `chc --version` for version-only output, `chc source status` for installation diagnostics, and `chc source update` for managed and local-linked updates, while retaining `chc version`, `chc status`, and `chc update` as undiscoverable compatibility aliases.

#### Scenario: Version flag
- **WHEN** a user runs `chc --version`
- **THEN** stdout reports the current `chc` CLI version
- **AND** the command exits successfully without inspecting Git installation state

#### Scenario: Legacy version command
- **WHEN** a user runs `chc version`
- **THEN** stdout reports the current `chc` CLI version using the existing output contract
- **AND** the command exits successfully

#### Scenario: Legacy version JSON command
- **WHEN** a user runs `chc version --json`
- **THEN** stdout reports the existing machine-readable version response
- **AND** the command exits successfully

#### Scenario: Consolidated command discovery
- **WHEN** a user views top-level help or requests top-level shell completion candidates
- **THEN** the discoverable lifecycle interface includes `source`
- **AND** the top-level `status`, `update`, and legacy `version` subcommands are not listed

#### Scenario: Status command
- **WHEN** a user runs `chc source status`
- **THEN** stdout reports CLI installation state including version, installation mode, actual source checkout directory, repository URL, ref, commit when available, and committed bundle presence

#### Scenario: Legacy status command
- **WHEN** a user runs `chc status` with any supported status flags
- **THEN** the CLI reports the same installation facts, errors, and exit status as `chc source status`
- **AND** the alias remains absent from root help and shell completion

#### Scenario: Local checkout status detection
- **WHEN** the globally installed CLI resolves to a local checkout outside the default managed source directory
- **THEN** `chc source status` reports `mode: local`
- **AND** it inspects that checkout for repository, ref, commit, and bundle state

#### Scenario: Remote managed status detection
- **WHEN** the globally installed CLI resolves to the default managed source directory
- **THEN** `chc source status` reports `mode: remote`
- **AND** it inspects the managed checkout for repository, ref, commit, and bundle state

#### Scenario: Explicit status directory override
- **WHEN** a user runs `chc source status --install-dir <path>`
- **THEN** status inspects the requested directory instead of the automatically detected source checkout

#### Scenario: Status JSON success
- **WHEN** a user runs `chc source status --json`
- **THEN** stdout contains exactly one JSON object with `ok: true`, `command: "source status"`, and the existing structured installation status fields

#### Scenario: Legacy status JSON success
- **WHEN** a user runs `chc status --json`
- **THEN** stdout contains exactly one JSON object with `ok: true`, `command: "status"`, and the existing structured installation status fields

#### Scenario: Executable CLI bin shim
- **WHEN** the root package is installed globally on a Unix-like target
- **THEN** the committed `apps/cli/bin/chc.mjs` entrypoint has executable permission
- **AND** the installed `chc` command can invoke it directly

#### Scenario: Default managed update with available changes
- **WHEN** a user runs `chc source update`
- **AND** the running command resolves to the default managed checkout
- **AND** that checkout's resolved origin and installed ref differ from the safe remote target
- **THEN** the command updates that managed checkout to the exact planned target
- **AND** verifies the committed CLI bundle before and after checkout mutation
- **AND** reinstalls the root package globally without running dependency installation or CLI build commands

#### Scenario: Default managed update already current
- **WHEN** a user runs `chc source update`
- **AND** the running command resolves to the default managed checkout already at its resolved target
- **THEN** the command exits successfully as already current
- **AND** does not check out files or reinstall the root package globally

#### Scenario: Default local-linked update is blocked
- **WHEN** a user runs `chc source update` from a linked local checkout with tracked changes or a divergent branch
- **THEN** the command blocks before checkout mutation and preserves the local work
- **AND** it does not mutate the managed checkout or relink the global command

#### Scenario: Default local-linked update with available changes
- **WHEN** a user runs `chc source update` without an install-directory override
- **AND** the running command resolves to a clean local Git checkout outside the default managed source directory with a newer safe remote target
- **THEN** the command fetches and fast-forwards that same checkout to the exact planned target
- **AND** it verifies the committed CLI bundle without changing the default managed checkout or reinstalling the global command

#### Scenario: Update availability check
- **WHEN** a user runs `chc source update --check` from the default managed installation
- **THEN** the command reports whether an update is required for that actual installed source
- **AND** does not clone, check out, pull, or globally install the package

#### Scenario: Local-linked update availability check is blocked
- **WHEN** a user runs `chc source update --check` from a local source directory that is not a Git checkout
- **THEN** the command reports the unsafe local source with an actionable failure
- **AND** it does not clone over that directory or mutate the managed checkout

#### Scenario: Local-linked update availability check
- **WHEN** a user runs `chc source update --check` without an install-directory override from a local-linked installation
- **THEN** the command checks the linked checkout's remote target and reports `update_available` or `up_to_date`
- **AND** it does not check out files, mutate the managed checkout, or reinstall the global command

#### Scenario: Managed source defaults follow the installed checkout
- **WHEN** the running command uses the default managed or linked local checkout and the user supplies no repository or ref override
- **THEN** update uses that checkout's actual `origin`
- **AND** it preserves the symbolic branch, exact tag, or detached commit currently selected by the installation

#### Scenario: Update overrides
- **WHEN** a user runs `chc source update --repo <url> --ref <ref> --install-dir <path>`
- **THEN** the command uses the provided repository URL, Git ref, and checkout directory
- **AND** treats the explicit install directory as authorization to apply the same preflight safety and no-op detection outside the default managed source

#### Scenario: Update JSON success
- **WHEN** a managed, linked local, or explicitly targeted `chc source update --json` succeeds or is already current
- **THEN** stdout contains exactly one JSON object with `ok: true`, `command: "source update"`, and structured result status and identity details

#### Scenario: Legacy update command
- **WHEN** a user runs `chc update` with any supported update flags
- **THEN** the CLI performs the same update, check, or failure behavior as `chc source update`
- **AND** the alias remains absent from root help and shell completion
- **AND** a successful JSON response retains `command: "update"`

#### Scenario: Update failure
- **WHEN** source selection, preflight safety, Git, committed-bundle verification, or global install fails during `chc source update`
- **THEN** the command exits non-zero
- **AND** reports an `update_failed` command error with the failed phase and bounded redacted recovery context

### Requirement: Managed Update Safety
Managed checkout install and update flows SHALL preserve local work, validate the selected target, and complete safety checks before mutating checkout files or reinstalling the global command.

#### Scenario: Local changes remain untouched
- **WHEN** the selected managed checkout contains tracked or untracked changes
- **THEN** the flow fails before changing the remote URL, checking out a ref, advancing a branch, or globally installing the package
- **AND** it does not automatically stash, reset, clean, or overwrite those changes

#### Scenario: Diverged branch remains untouched
- **WHEN** an existing selected branch has diverged from its resolved remote branch
- **THEN** the flow fails before checkout or global installation
- **AND** it does not reset or rebase the branch

#### Scenario: Invalid target bundle remains untouched
- **WHEN** the resolved target commit does not contain `apps/cli/dist/index.js`
- **THEN** the flow fails before changing the live checkout or global installation
- **AND** identifies the missing committed bundle

#### Scenario: Planned commit is applied exactly
- **WHEN** a safe managed branch advances remotely after preflight resolves a target commit
- **THEN** the current apply operation installs the preflight target commit
- **AND** a later check can report the newer remote commit

#### Scenario: Local-linked source remains untouched by default
- **WHEN** a default local-linked update finds that the checkout is already at its resolved target
- **THEN** it does not change that checkout or the default managed checkout
- **AND** it does not relink the global command

### Requirement: Local Update Documentation
The repository SHALL explain how `chc source update` updates its actual linked checkout in both managed and local modes, and when local CLI source edits require rebuilding the committed bundle.

#### Scenario: Local-linked update guidance
- **WHEN** a developer reads CLI lifecycle documentation
- **THEN** it explains that a local-linked `chc` follows the checkout containing its committed bundle
- **AND** it explains that default update/check can fast-forward that checkout without touching the managed checkout or global link
- **AND** it documents that locally edited CLI source still needs a bundle rebuild, and how to switch to remote managed installation

## ADDED Requirements

### Requirement: Linked local update preserves the checkout and command link

Default local-linked updates SHALL fast-forward the actual running Git checkout only when safe, preserve unrelated untracked files, and leave its global command link unchanged.

#### Scenario: Unrelated untracked local files remain
- **WHEN** a linked local checkout has untracked files that do not conflict with the remote update
- **THEN** update may fast-forward the tracked checkout while leaving the untracked files unchanged

#### Scenario: Tracked local edits block update
- **WHEN** a linked local checkout has staged or unstaged tracked changes
- **THEN** update blocks before checkout mutation and does not stash, reset, or overwrite those changes

#### Scenario: Conflicting untracked path blocks merge
- **WHEN** a remote update would overwrite an untracked local path
- **THEN** update fails without overwriting that path or globally reinstalling the command

#### Scenario: Non-Git local runtime is not cloned over
- **WHEN** the running command resolves to a local source directory that is not a Git checkout
- **THEN** default update blocks with actionable guidance instead of cloning into that directory

#### Scenario: Local command remains linked after update
- **WHEN** a safe local-linked update completes
- **THEN** the next command invocation uses the updated committed bundle from the same checkout
- **AND** the update does not run a global npm installation or relink the command
