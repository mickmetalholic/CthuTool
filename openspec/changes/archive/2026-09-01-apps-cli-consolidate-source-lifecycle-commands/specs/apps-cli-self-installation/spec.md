## MODIFIED Requirements

### Requirement: CLI Lifecycle Commands
The CLI SHALL provide canonical lifecycle entry points for viewing the installed CLI version, inspecting installation state, and safely updating the global `chc` installation from committed prebuilt output according to its actual source checkout. The discoverable interface SHALL use `chc --version` for version-only output, `chc source status` for installation diagnostics, and `chc source update` for managed updates, while retaining `chc version`, `chc status`, and `chc update` as undiscoverable compatibility aliases.

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
- **WHEN** a user runs `chc source update` without an install-directory override
- **AND** the running command resolves to a checkout outside the default managed source directory
- **THEN** the command identifies the actual local source and exits with an actionable `update_failed` result
- **AND** it does not fetch, mutate either checkout, or change the global npm link

#### Scenario: Update availability check
- **WHEN** a user runs `chc source update --check` from the default managed installation
- **THEN** the command reports whether an update is required for that actual installed source
- **AND** does not clone, check out, pull, or globally install the package

#### Scenario: Local-linked update availability check is blocked
- **WHEN** a user runs `chc source update --check` without an install-directory override from a local-linked installation
- **THEN** the command reports that the local checkout is developer-managed
- **AND** it performs no remote fetch, checkout mutation, managed-checkout mutation, or global installation

#### Scenario: Managed source defaults follow the installed checkout
- **WHEN** the running command uses the default managed checkout and the user supplies no repository or ref override
- **THEN** update uses that checkout's actual `origin`
- **AND** it preserves the symbolic branch, exact tag, or detached commit currently selected by the installation

#### Scenario: Update overrides
- **WHEN** a user runs `chc source update --repo <url> --ref <ref> --install-dir <path>`
- **THEN** the command uses the provided repository URL, Git ref, and checkout directory
- **AND** treats the explicit install directory as authorization to apply the same preflight safety and no-op detection outside the default managed source

#### Scenario: Update JSON success
- **WHEN** a managed or explicitly targeted `chc source update --json` succeeds or is already current
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

### Requirement: Installation Documentation
The repository SHALL document the public and local CLI install flows, lightweight target prerequisites, committed runtime bundle, canonical lifecycle commands, compatibility aliases, and update path.

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
- **THEN** it shows `chc --version`, `chc source status`, and `chc source update` as the canonical lifecycle entry points
- **AND** it does not present `chc version`, `chc status`, or `chc update` as canonical commands
- **AND** it identifies the top-level subcommands as temporary compatibility aliases when migration guidance is relevant

#### Scenario: Update documented
- **WHEN** a user reads the CLI installation documentation
- **THEN** it shows `chc source update` as the update path after the first install
