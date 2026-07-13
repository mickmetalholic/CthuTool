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
The repository SHALL document the public and local CLI install flows, lightweight target prerequisites, committed runtime bundle, canonical lifecycle commands, and update path.

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
- **THEN** it shows `chc --version`, `chc status`, and `chc update` as the canonical lifecycle entry points
- **AND** it does not present `chc version` as a canonical command

#### Scenario: Update documented
- **WHEN** a user reads the CLI installation documentation
- **THEN** it shows `chc update` as the update path after the first install
