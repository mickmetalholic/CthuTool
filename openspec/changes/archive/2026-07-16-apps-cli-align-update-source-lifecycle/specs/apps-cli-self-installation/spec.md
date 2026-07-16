## MODIFIED Requirements

### Requirement: CLI Lifecycle Commands
The CLI SHALL provide top-level lifecycle entry points for viewing the installed CLI version, inspecting installation state, and safely updating the global `chc` installation from committed prebuilt output according to its actual source checkout. The discoverable interface SHALL use `chc --version` for version-only output and `chc status` for installation diagnostics, while retaining `chc version` as an undiscoverable compatibility alias.

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
- **THEN** the discoverable lifecycle commands include `status` and `update`
- **AND** the legacy `version` subcommand is not listed

#### Scenario: Status command
- **WHEN** a user runs `chc status`
- **THEN** stdout reports CLI installation state including version, installation mode, actual source checkout directory, repository URL, ref, commit when available, and committed bundle presence

#### Scenario: Local checkout status detection
- **WHEN** the globally installed CLI resolves to a local checkout outside the default managed source directory
- **THEN** `chc status` reports `mode: local`
- **AND** it inspects that checkout for repository, ref, commit, and bundle state

#### Scenario: Remote managed status detection
- **WHEN** the globally installed CLI resolves to the default managed source directory
- **THEN** `chc status` reports `mode: remote`
- **AND** it inspects the managed checkout for repository, ref, commit, and bundle state

#### Scenario: Explicit status directory override
- **WHEN** a user runs `chc status --install-dir <path>`
- **THEN** status inspects the requested directory instead of the automatically detected source checkout

#### Scenario: Executable CLI bin shim
- **WHEN** the root package is installed globally on a Unix-like target
- **THEN** the committed `apps/cli/bin/chc.mjs` entrypoint has executable permission
- **AND** the installed `chc` command can invoke it directly

#### Scenario: Default managed update with available changes
- **WHEN** a user runs `chc update`
- **AND** the running command resolves to the default managed checkout
- **AND** that checkout's resolved origin and installed ref differ from the safe remote target
- **THEN** the command updates that managed checkout to the exact planned target
- **AND** verifies the committed CLI bundle before and after checkout mutation
- **AND** reinstalls the root package globally without running dependency installation or CLI build commands

#### Scenario: Default managed update already current
- **WHEN** a user runs `chc update`
- **AND** the running command resolves to the default managed checkout already at its resolved target
- **THEN** the command exits successfully as already current
- **AND** does not check out files or reinstall the root package globally

#### Scenario: Default local-linked update is blocked
- **WHEN** a user runs `chc update` without an install-directory override
- **AND** the running command resolves to a checkout outside the default managed source directory
- **THEN** the command identifies the actual local source and exits with an actionable `update_failed` result
- **AND** it does not fetch, mutate either checkout, or change the global npm link

#### Scenario: Update availability check
- **WHEN** a user runs `chc update --check` from the default managed installation
- **THEN** the command reports whether an update is required for that actual installed source
- **AND** does not clone, check out, pull, or globally install the package

#### Scenario: Local-linked update availability check is blocked
- **WHEN** a user runs `chc update --check` without an install-directory override from a local-linked installation
- **THEN** the command reports that the local checkout is developer-managed
- **AND** it performs no remote fetch, checkout mutation, managed-checkout mutation, or global installation

#### Scenario: Managed source defaults follow the installed checkout
- **WHEN** the running command uses the default managed checkout and the user supplies no repository or ref override
- **THEN** update uses that checkout's actual `origin`
- **AND** it preserves the symbolic branch, exact tag, or detached commit currently selected by the installation

#### Scenario: Update overrides
- **WHEN** a user runs `chc update --repo <url> --ref <ref> --install-dir <path>`
- **THEN** the command uses the provided repository URL, Git ref, and checkout directory
- **AND** treats the explicit install directory as authorization to apply the same preflight safety and no-op detection outside the default managed source

#### Scenario: Update JSON success
- **WHEN** a managed or explicitly targeted `chc update --json` succeeds or is already current
- **THEN** stdout contains exactly one JSON object with `ok: true`, `command: "update"`, and structured result status and identity details

#### Scenario: Update failure
- **WHEN** source selection, preflight safety, Git, committed-bundle verification, or global install fails during `chc update`
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
- **WHEN** the running global command is linked to a local checkout and no install-directory override is provided
- **THEN** update does not mutate that checkout or the default managed checkout
- **AND** it does not relink the global command

## ADDED Requirements

### Requirement: Local Update Documentation
The repository SHALL distinguish managed self-update from the manual local-development update workflow.

#### Scenario: Local-linked update guidance
- **WHEN** a developer reads CLI lifecycle documentation
- **THEN** it explains that a local-linked `chc` follows the checkout containing its committed bundle
- **AND** it instructs the developer to update and rebuild that checkout manually
- **AND** it documents the remote restore command instead of implying that default `chc update` mutates the managed checkout
