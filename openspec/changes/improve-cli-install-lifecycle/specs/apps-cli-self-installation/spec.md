## MODIFIED Requirements

### Requirement: Public GitHub Installer
The repository SHALL provide a shell installer that can be executed from the public GitHub raw URL or from a local checkout to install the `chc` CLI globally from committed prebuilt output.

#### Scenario: Public raw installer command
- **WHEN** a user runs the public raw GitHub installer with `curl -fsSL ... | bash`
- **THEN** the installer runs in remote managed mode
- **AND** it clones or updates the configured repository into a managed local checkout
- **AND** it verifies the committed `apps/cli/dist/index.js` runtime bundle is present
- **AND** it installs the root package globally so `chc` is available on `PATH`

#### Scenario: Local checkout installer command
- **WHEN** a user runs `scripts/install-chc.sh` from a repository checkout without forcing remote mode
- **THEN** the installer runs in local checkout mode
- **AND** it uses the repository containing the script as the install source
- **AND** it does not clone, fetch, checkout, or pull the managed source checkout
- **AND** it verifies the local `apps/cli/dist/index.js` runtime bundle is present
- **AND** it installs the local root package globally so `chc` is available on `PATH`

#### Scenario: Installer default repository
- **WHEN** the installer runs in remote managed mode without repository override environment variables
- **THEN** it uses `https://github.com/mickmetalholic/CthuTool.git` as the source repository

#### Scenario: Installer configurable source
- **WHEN** the user sets `CHC_REPO_URL`, `CHC_REPO`, `CHC_REF`, or `CHC_INSTALL_DIR`
- **THEN** the installer uses those values for repository URL, Git ref, and local checkout directory in remote managed mode

#### Scenario: Installer configurable mode
- **WHEN** the user sets an installer mode override
- **THEN** the installer uses the requested mode instead of auto-detecting from invocation style
- **AND** remote managed mode uses the configured managed checkout source
- **AND** local checkout mode uses the repository containing the local installer script

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

#### Scenario: Automatic zsh completion setup
- **WHEN** the installer succeeds and the user's login shell is zsh
- **AND** completion setup has not been disabled
- **THEN** the installer enables persistent `chc` completion in the user's zsh profile

#### Scenario: Automatic completion setup opt-out
- **WHEN** the user sets `CHC_INSTALL_COMPLETION=none`
- **THEN** the installer does not modify a shell profile

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
- **AND** it reports an `update_failed` command error

### Requirement: Installation Documentation
The repository documentation SHALL describe public GitHub installation, local checkout installation, prebuilt bundle expectations, lifecycle commands, and update usage.

#### Scenario: Public install documented
- **WHEN** a user reads the root README
- **THEN** it shows a `curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash` installation command
- **AND** it explains that public raw installation uses the managed checkout
- **AND** it explains automatic zsh completion setup and its opt-out

#### Scenario: Local checkout install documented
- **WHEN** a developer reads the CLI installation documentation
- **THEN** it explains that running `scripts/install-chc.sh` from a local checkout installs global `chc` from that checkout
- **AND** it shows the CLI watch build command needed for source-editing development

#### Scenario: Remote restore documented
- **WHEN** a developer reads the CLI installation documentation
- **THEN** it shows how to force remote managed installation after a local checkout install

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
