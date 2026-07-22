# apps-cli-self-installation Specification

## Purpose
Define GitHub-based personal installation, lifecycle status, and update behavior for the `chc` CLI.
## Requirements
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

### Requirement: Managed Source Checkout
Remote managed install and update flows SHALL use a managed source checkout containing committed CLI build output as the source for the global `chc` installation.

#### Scenario: First install clone
- **WHEN** the remote managed checkout directory does not contain a Git checkout
- **THEN** the remote managed install flow clones the configured repository into that directory

#### Scenario: Existing checkout update
- **WHEN** the remote managed checkout directory already contains a Git checkout
- **THEN** the remote managed install flow updates the remote URL
- **AND** it fetches tags from origin before checking out the requested ref

#### Scenario: Branch fast-forward
- **WHEN** the requested ref exists as `origin/<ref>`
- **THEN** the remote managed install flow fast-forwards the checkout from origin for that ref

#### Scenario: Tag or commit checkout
- **WHEN** the requested ref does not exist as `origin/<ref>`
- **THEN** the remote managed install flow does not attempt a branch pull after checkout

#### Scenario: Local checkout mode bypasses managed checkout
- **WHEN** the installer runs in local checkout mode
- **THEN** the installer does not use the managed source checkout as the install source
- **AND** it does not mutate the managed source checkout

#### Scenario: Missing committed bundle
- **WHEN** the selected install source does not contain `apps/cli/dist/index.js`
- **THEN** the install flow fails before global installation with a clear missing-bundle message

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

### Requirement: Local Update Documentation
The repository SHALL distinguish managed self-update from the manual local-development update workflow.

#### Scenario: Local-linked update guidance
- **WHEN** a developer reads CLI lifecycle documentation
- **THEN** it explains that a local-linked `chc` follows the checkout containing its committed bundle
- **AND** it instructs the developer to update and rebuild that checkout manually
- **AND** it documents the remote restore command instead of implying that default `chc update` mutates the managed checkout
