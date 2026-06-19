## MODIFIED Requirements

### Requirement: Public GitHub Installer
The repository SHALL provide a shell installer that can be executed from the public GitHub raw URL or from a local checkout to install the `chc` CLI globally from committed prebuilt output.

#### Scenario: Public raw installer command
- **WHEN** a user runs the public raw GitHub installer with `curl -fsSL ... | bash`
- **THEN** the installer clones or updates the configured repository into a managed local checkout
- **AND** it verifies the committed `apps/cli/dist/index.js` runtime bundle is present
- **AND** it installs the root package globally so `chc` is available on `PATH`

#### Scenario: Installer default repository
- **WHEN** the installer runs without repository override environment variables
- **THEN** it uses `https://github.com/mickmetalholic/CthuTool.git` as the source repository

#### Scenario: Installer configurable source
- **WHEN** the user sets `CHC_REPO_URL`, `CHC_REPO`, `CHC_REF`, or `CHC_INSTALL_DIR`
- **THEN** the installer uses those values for repository URL, Git ref, and local checkout directory

#### Scenario: Installer prerequisites
- **WHEN** a required command such as `git`, `node`, or `npm` is missing
- **THEN** the installer fails with a clear missing-command message before attempting installation

#### Scenario: Installer skips local build toolchain
- **WHEN** the installer runs on a target machine
- **THEN** it does not require `pnpm` or `bun`
- **AND** it does not run workspace dependency installation or CLI build commands

#### Scenario: Node runtime guard
- **WHEN** the local Node major version is not 24
- **THEN** the installer fails before global installation

### Requirement: Managed Source Checkout
The install and update flows SHALL use a managed source checkout containing committed CLI build output as the source for the global `chc` installation.

#### Scenario: First install clone
- **WHEN** the managed checkout directory does not contain a Git checkout
- **THEN** the install flow clones the configured repository into that directory

#### Scenario: Existing checkout update
- **WHEN** the managed checkout directory already contains a Git checkout
- **THEN** the install flow updates the remote URL
- **AND** it fetches tags from origin before checking out the requested ref

#### Scenario: Branch fast-forward
- **WHEN** the requested ref exists as `origin/<ref>`
- **THEN** the install flow fast-forwards the checkout from origin for that ref

#### Scenario: Tag or commit checkout
- **WHEN** the requested ref does not exist as `origin/<ref>`
- **THEN** the install flow does not attempt a branch pull after checkout

#### Scenario: Missing committed bundle
- **WHEN** the requested checkout does not contain `apps/cli/dist/index.js`
- **THEN** the install flow fails before global installation with a clear missing-bundle message

### Requirement: CLI Lifecycle Commands
The CLI SHALL provide top-level lifecycle commands for viewing the installed CLI version, inspecting installation state, and updating the global `chc` installation from committed prebuilt output.

#### Scenario: Version command
- **WHEN** a user runs `chc version`
- **THEN** stdout reports the current `chc` CLI version

#### Scenario: Version flag
- **WHEN** a user runs `chc --version`
- **THEN** stdout reports the current `chc` CLI version
- **AND** the command exits successfully

#### Scenario: Status command
- **WHEN** a user runs `chc status`
- **THEN** stdout reports CLI installation state including version, managed checkout directory, repository URL, ref, commit when available, and committed bundle presence

#### Scenario: Default update
- **WHEN** a user runs `chc update`
- **THEN** the command uses the default repository, `main` ref, and managed checkout directory
- **AND** it verifies the committed CLI bundle is present
- **AND** it reinstalls the root package globally without running dependency installation or CLI build commands

#### Scenario: Update overrides
- **WHEN** a user runs `chc update --repo <url> --ref <ref> --install-dir <path>`
- **THEN** the command uses the provided repository URL, Git ref, and checkout directory

#### Scenario: Update JSON success
- **WHEN** a user runs `chc update --json` and the update succeeds
- **THEN** stdout contains exactly one JSON object with `ok: true`, `command: "update"`, and result details

#### Scenario: Update failure
- **WHEN** any Git, committed-bundle verification, or global install step fails during `chc update`
- **THEN** the command exits non-zero
- **AND** it reports a `self_update_failed` command error

#### Scenario: Legacy self-update alias
- **WHEN** a user runs `chc self-update`
- **THEN** the CLI performs the same update behavior as `chc update`
- **AND** documentation presents `chc update` as the preferred command

### Requirement: Installation Documentation
The repository documentation SHALL describe public GitHub installation, prebuilt bundle expectations, lifecycle commands, and update usage.

#### Scenario: Public install documented
- **WHEN** a user reads the root README
- **THEN** it shows a `curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash` installation command

#### Scenario: Lighter target prerequisites documented
- **WHEN** a user reads the CLI installation documentation
- **THEN** it explains that target machines need `git`, Node 24, and `npm`, but do not need `pnpm` or `bun` for install/update

#### Scenario: Committed bundle documented
- **WHEN** a developer reads the CLI installation documentation
- **THEN** it explains that CLI source changes must refresh the committed `apps/cli/dist/index.js` bundle

#### Scenario: Lifecycle commands documented
- **WHEN** a user reads the CLI installation documentation
- **THEN** it shows `chc version`, `chc status`, and `chc update`

#### Scenario: Update documented
- **WHEN** a user reads the CLI installation documentation
- **THEN** it shows `chc update` as the update path after the first install
