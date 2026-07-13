## ADDED Requirements

### Requirement: Managed Update Safety
Managed checkout updates SHALL preserve local work and SHALL complete safety checks before mutating checkout files or reinstalling the global command.

#### Scenario: Local changes remain untouched
- **WHEN** the selected update checkout contains tracked or untracked changes
- **THEN** the update fails before changing the remote URL, checking out a ref, pulling, or globally installing the package
- **AND** it does not automatically stash, reset, clean, or overwrite those changes

#### Scenario: Diverged branch remains untouched
- **WHEN** an existing selected branch has diverged from its resolved remote branch
- **THEN** the update fails before checkout or global installation
- **AND** it does not reset or rebase the branch

## MODIFIED Requirements

### Requirement: CLI Lifecycle Commands
The CLI SHALL provide top-level lifecycle entry points for viewing the installed CLI version, inspecting installation state, and updating the global `chc` installation from committed prebuilt output. The discoverable interface SHALL use `chc --version` for version-only output and `chc status` for installation diagnostics, while retaining `chc version` as an undiscoverable compatibility alias.

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

#### Scenario: Default update with available changes
- **WHEN** a user runs `chc update` and the default repository `main` ref differs from the safe managed checkout
- **THEN** the command updates the managed checkout to the resolved target
- **AND** verifies the committed CLI bundle is present
- **AND** reinstalls the root package globally without running dependency installation or CLI build commands

#### Scenario: Default update already current
- **WHEN** a user runs `chc update` and the safe managed checkout already matches the resolved target
- **THEN** the command exits successfully as already current
- **AND** does not check out files or reinstall the root package globally

#### Scenario: Update availability check
- **WHEN** a user runs `chc update --check`
- **THEN** the command reports whether installation or an update is required
- **AND** does not clone, check out, pull, or globally install the package

#### Scenario: Update overrides
- **WHEN** a user runs `chc update --repo <url> --ref <ref> --install-dir <path>`
- **THEN** the command uses the provided repository URL, Git ref, and checkout directory
- **AND** applies the same preflight safety and no-op detection as the default managed update

#### Scenario: Update JSON success
- **WHEN** a user runs `chc update --json` and the update succeeds or is already current
- **THEN** stdout contains exactly one JSON object with `ok: true`, `command: "update"`, and structured result status and identity details

#### Scenario: Update failure
- **WHEN** preflight safety, Git, committed-bundle verification, or global install fails during `chc update`
- **THEN** the command exits non-zero
- **AND** reports an `update_failed` command error with the failed phase and bounded recovery context
