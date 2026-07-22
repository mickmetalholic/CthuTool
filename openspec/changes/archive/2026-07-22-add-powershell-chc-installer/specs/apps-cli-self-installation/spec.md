## MODIFIED Requirements

### Requirement: Public GitHub Installer
The repository SHALL provide Bash and PowerShell installers that can be executed from the public GitHub raw URL or from a local checkout to install the `chc` CLI globally from committed prebuilt output.

#### Scenario: Public raw installer command
- **WHEN** a user runs the public raw GitHub installer with `curl -fsSL ... | bash`
- **THEN** the installer runs in remote managed mode
- **AND** it clones or updates the configured repository into a managed local checkout
- **AND** it verifies the committed `apps/cli/dist/index.js` runtime bundle is present
- **AND** it installs the root package globally so `chc` is available on `PATH`

#### Scenario: Public raw PowerShell installer command
- **WHEN** a Windows user runs the public raw GitHub installer with `irm .../install-chc.ps1 | iex`
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

#### Scenario: Local PowerShell checkout installer command
- **WHEN** a user runs `scripts/install-chc.ps1` from a repository checkout without forcing remote mode
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

#### Scenario: Automatic PowerShell completion setup
- **WHEN** the PowerShell installer succeeds
- **AND** completion setup has not been disabled
- **THEN** the installer enables persistent `chc` completion in the user's PowerShell profile

#### Scenario: Automatic completion setup opt-out
- **WHEN** the user sets `CHC_INSTALL_COMPLETION=none`
- **THEN** the installer does not modify a shell profile

### Requirement: Installation Documentation
The repository SHALL document the public and local CLI install flows, lightweight target prerequisites, committed runtime bundle, canonical lifecycle commands, and update path.

#### Scenario: Public install documented
- **WHEN** a user reads the root README
- **THEN** it shows a `curl -fsSL https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.sh | bash` installation command
- **AND** it shows an `irm https://raw.githubusercontent.com/mickmetalholic/CthuTool/main/scripts/install-chc.ps1 | iex` PowerShell installation command
- **AND** it explains that public raw installation uses the managed checkout
- **AND** it explains automatic zsh and PowerShell completion setup and its opt-out

#### Scenario: Local checkout install documented
- **WHEN** a developer reads the CLI installation documentation
- **THEN** it explains that running either local installer from a checkout installs global `chc` from that checkout
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
- **THEN** it shows `chc --version`, `chc status`, and `chc update` as the canonical lifecycle entry points
- **AND** it does not present `chc version` as a canonical command

#### Scenario: Update documented
- **WHEN** a user reads the CLI installation documentation
- **THEN** it shows `chc update` as the update path after the first install
