## ADDED Requirements

### Requirement: Public GitHub Installer
The repository SHALL provide a shell installer that can be executed from the public GitHub raw URL or from a local checkout to install the `chc` CLI globally.

#### Scenario: Public raw installer command
- **WHEN** a user runs the public raw GitHub installer with `curl -fsSL ... | bash`
- **THEN** the installer clones or updates the configured repository into a managed local checkout
- **AND** it builds `@cthutool/cli`
- **AND** it installs the root package globally so `chc` is available on `PATH`

#### Scenario: Installer default repository
- **WHEN** the installer runs without repository override environment variables
- **THEN** it uses `https://github.com/mickmetalholic/CthuTool.git` as the source repository

#### Scenario: Installer configurable source
- **WHEN** the user sets `CHC_REPO_URL`, `CHC_REPO`, `CHC_REF`, or `CHC_INSTALL_DIR`
- **THEN** the installer uses those values for repository URL, Git ref, and local checkout directory

#### Scenario: Installer prerequisites
- **WHEN** a required command such as `git`, `node`, `npm`, `pnpm`, or `bun` is missing
- **THEN** the installer fails with a clear missing-command message before attempting installation

#### Scenario: Node runtime guard
- **WHEN** the local Node major version is not 24
- **THEN** the installer fails before dependency installation or build

### Requirement: Managed Source Checkout
The install and update flows SHALL use a managed source checkout as the build source for the global `chc` installation.

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

### Requirement: CLI Self Update
The CLI SHALL provide a `self-update` command that updates the global `chc` installation from the configured Git repository.

#### Scenario: Default self-update
- **WHEN** a user runs `chc self-update`
- **THEN** the command uses the default repository, `main` ref, and managed checkout directory
- **AND** it installs dependencies, builds the CLI, and reinstalls the root package globally

#### Scenario: Self-update overrides
- **WHEN** a user runs `chc self-update --repo <url> --ref <ref> --install-dir <path>`
- **THEN** the command uses the provided repository URL, Git ref, and checkout directory

#### Scenario: Self-update JSON success
- **WHEN** a user runs `chc self-update --json` and the update succeeds
- **THEN** stdout contains exactly one JSON object with `ok: true`, `command: "self-update"`, and result details

#### Scenario: Self-update failure
- **WHEN** any Git, dependency install, build, or global install step fails during `chc self-update`
- **THEN** the command exits non-zero
- **AND** it reports a `self_update_failed` command error

### Requirement: Installation Documentation
The repository documentation SHALL describe public GitHub installation and self-update usage.

#### Scenario: Public install documented
- **WHEN** a user reads the root README
- **THEN** it shows a `curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash` installation command

#### Scenario: Self-update documented
- **WHEN** a user reads the CLI installation documentation
- **THEN** it shows `chc self-update` as the update path after the first install
