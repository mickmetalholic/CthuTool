# apps-cli-source-switching Specification

## Purpose
Define how global `chc` discovers, identifies, presents, and switches among managed, main, and linked-worktree runtime sources while preserving Git state and recoverability.

## Requirements

### Requirement: Source identity remains mode-compatible

The CLI SHALL distinguish the active runtime source as `main`, `worktree`, or `managed` while preserving the existing public installation mode values `local` and `remote`.

#### Scenario: Main development checkout is active

- **WHEN** the running global command resolves to the registered development repository's main worktree
- **THEN** source status reports `mode: local` and `sourceKind: main`
- **AND** it reports the canonical source path, ref, commit, dirty state, and committed-bundle presence when available

#### Scenario: Linked development worktree is active

- **WHEN** the running global command resolves to a linked worktree of the registered development repository
- **THEN** source status reports `mode: local` and `sourceKind: worktree`
- **AND** it reports the worktree selector, branch or detached state, commit, dirty state, and committed-bundle presence

#### Scenario: Default managed checkout is active

- **WHEN** the running global command resolves to the default managed source directory
- **THEN** source status reports `mode: remote` and `sourceKind: managed`
- **AND** it does not classify a managed source as a development worktree solely because it is a Git checkout

### Requirement: Source command group

The CLI SHALL expose a public `source` command group with `list`, `current`, `use`, and `register` operations that share one source discovery and selector-resolution model.

#### Scenario: Bare source group is invoked

- **WHEN** a user runs `chc source` or `chc source --help`
- **THEN** the CLI renders help containing `list`, `current`, `use`, and `register`
- **AND** it exits without changing the global installation, Git state, or source registry

#### Scenario: Available sources are listed

- **WHEN** a user runs `chc source list`
- **THEN** the CLI lists the active source, the default managed source, the registered main checkout, and every currently discoverable linked worktree
- **AND** each candidate reports its stable selector, kind, path, availability, and bundle state

#### Scenario: Current source is requested

- **WHEN** a user runs `chc source current`
- **THEN** the CLI reports the source that actually provides the running module rather than a separately persisted active value

#### Scenario: Interactive source selection

- **WHEN** an interactive TTY user runs `chc source use` without a selector
- **THEN** the CLI prompts with candidates from the same discovery provider used by list and completion
- **AND** no source is changed until the user makes an explicit selection

#### Scenario: Non-interactive selection is incomplete

- **WHEN** a non-interactive, JSON, or `--no-interactive` caller runs `chc source use` without a selector
- **THEN** the command fails with `missing_required_argument`
- **AND** it does not prompt or mutate global installation state

### Requirement: Development repository and worktree discovery

The CLI SHALL persist at most one preferred development repository anchor and SHALL dynamically enumerate its current worktree topology from Git.

#### Scenario: Local source is remembered before managed switching

- **WHEN** a user successfully switches from a development main checkout or linked worktree to the managed source
- **THEN** the CLI stores the validated main worktree and Git repository identity as the preferred development anchor
- **AND** it does not persist a snapshot of every linked worktree

#### Scenario: Registered repository worktrees are discovered

- **WHEN** the preferred development anchor remains a valid CthuTool Git checkout
- **THEN** the CLI uses `git worktree list --porcelain` to enumerate the main worktree and current linked worktrees
- **AND** newly added or removed worktrees are reflected without manually synchronizing the registry

#### Scenario: Explicit path establishes the development anchor

- **WHEN** a user successfully runs `chc source register <path>` or selects `.` or an explicit development checkout path
- **THEN** the CLI validates the repository and stores its main worktree as the preferred development anchor
- **AND** registration alone does not relink the global command

#### Scenario: Registered repository is unavailable

- **WHEN** the stored main checkout is missing, moved, or no longer matches its stored Git identity
- **THEN** source discovery marks the local source unavailable with bounded recovery guidance
- **AND** it does not scan the home directory or silently select another clone

### Requirement: Deterministic source selectors

The CLI SHALL resolve `local`, `remote`, `.`, dynamic worktree ids, and explicit checkout paths without branch-name or detached-HEAD ambiguity.

#### Scenario: Local selector is used

- **WHEN** a user runs `chc source use local`
- **THEN** the CLI selects the registered development repository's main worktree

#### Scenario: Remote selector is used

- **WHEN** a user runs `chc source use remote`
- **THEN** the CLI selects the default managed source directory

#### Scenario: Current-directory selector is used

- **WHEN** a user runs `chc source use .` from a valid CthuTool main or linked worktree
- **THEN** the CLI resolves that checkout root and selects it
- **AND** it records the corresponding main development worktree as the preferred anchor after success

#### Scenario: Worktree id is used

- **WHEN** a user selects a currently discovered worktree id
- **THEN** the CLI resolves exactly the canonical path represented by that id
- **AND** duplicate branch names or detached worktrees do not make the selection ambiguous

#### Scenario: Explicit path is used

- **WHEN** a user supplies an absolute or relative checkout path
- **THEN** the CLI canonicalizes and validates that path before treating it as a source

### Requirement: Git-preserving development source switch

Switching to a main checkout or linked worktree SHALL validate and relink the global command without changing Git repository or worktree state.

#### Scenario: Clean worktree is selected

- **WHEN** a valid clean development worktree containing the committed CLI bundle is selected
- **THEN** the CLI relinks the global `cthutool` package to that worktree
- **AND** it performs no fetch, checkout, pull, merge, rebase, reset, stash, or clean operation

#### Scenario: Dirty worktree is selected

- **WHEN** a valid development worktree has tracked or untracked changes and contains the committed CLI bundle
- **THEN** the CLI permits the explicit source switch and reports the dirty state
- **AND** it does not modify, discard, stage, or commit those changes

#### Scenario: Target bundle is missing

- **WHEN** the selected checkout does not contain `apps/cli/dist/index.js`
- **THEN** switching is blocked before npm global installation
- **AND** the error instructs the developer to refresh the committed bundle

#### Scenario: Target is not a CthuTool checkout

- **WHEN** the selected path does not contain the expected CthuTool root package and Git identity
- **THEN** switching and registration fail before changing global installation or registry state

### Requirement: Predictable managed source selection

Selecting the managed source SHALL not implicitly update an existing checkout, and creation of a missing managed checkout SHALL require explicit bootstrap intent.

#### Scenario: Existing managed source is selected

- **WHEN** the default managed checkout and its committed CLI bundle exist
- **AND** the user runs `chc source use remote` without `--bootstrap`
- **THEN** the CLI relinks the global command to the existing managed checkout
- **AND** it performs no fetch, checkout, or ref change

#### Scenario: Missing managed source is selected without bootstrap

- **WHEN** the default managed checkout is absent
- **AND** the user runs `chc source use remote` without `--bootstrap`
- **THEN** the command fails with actionable managed-source bootstrap guidance
- **AND** it does not clone or change the global command

#### Scenario: Missing managed source is explicitly bootstrapped

- **WHEN** the default managed checkout is absent
- **AND** the user runs `chc source use remote --bootstrap`
- **THEN** the CLI reuses the managed install/update safety flow to create and validate the checkout
- **AND** it relinks the global command only after the target committed bundle is valid

#### Scenario: Existing managed source is bootstrapped or refreshed

- **WHEN** a user explicitly combines managed selection with `--bootstrap`
- **THEN** the existing managed update preflight, dirty-checkout, divergence, exact-target, and bundle safety requirements apply

### Requirement: Serialized and verified global relink

The CLI SHALL serialize source switches, preflight targets before npm mutation, and verify that a successful npm global installation resolves to the requested canonical source.

#### Scenario: Source switch succeeds

- **WHEN** target validation succeeds and the source switch lock is acquired
- **THEN** the CLI runs `npm install -g --ignore-scripts <target>`
- **AND** it verifies the installed global package target before reporting success
- **AND** the next `chc` invocation loads the selected source

#### Scenario: Source is already active

- **WHEN** the selected canonical source equals the actual running source
- **THEN** the command reports an already-active success result
- **AND** it does not run npm global installation or update registry state unnecessarily

#### Scenario: Concurrent source switch is in progress

- **WHEN** another source switch holds the user-level switch lock
- **THEN** the command waits only for the documented bound or fails with a stable busy error
- **AND** it does not run a concurrent npm global mutation

#### Scenario: Global relink fails

- **WHEN** npm installation or postcondition verification fails
- **THEN** the command exits non-zero with the previous source, requested target, bounded cause, and public raw installer recovery guidance
- **AND** it does not claim that the requested source is active

### Requirement: Structured source output and errors

Source commands SHALL follow the shared CLI interactivity, quiet, JSON stdout, diagnostics, and stable error contracts.

#### Scenario: JSON source list succeeds

- **WHEN** a user runs `chc source list --json`
- **THEN** stdout contains exactly one success object with `command: "source list"`, the active source, and structured candidates
- **AND** diagnostics and unavailable-source warnings remain off stdout

#### Scenario: JSON source switch succeeds

- **WHEN** a user runs `chc source use <selector> --json` and switching succeeds
- **THEN** stdout contains exactly one success object identifying the previous and selected canonical sources

#### Scenario: Source operation fails

- **WHEN** discovery, validation, locking, bootstrap, npm relink, or postcondition verification fails
- **THEN** the command returns a stable source error code and non-zero exit status
- **AND** human and JSON output contain bounded actionable recovery context

#### Scenario: Quiet source operation runs

- **WHEN** a user supplies `--quiet`
- **THEN** nonessential source metadata and progress are suppressed
- **AND** failures remain visible through the shared command error contract

### Requirement: Source discovery and recovery are documented

The CLI SHALL expose source operations through help and shell completion and SHALL document development bundle and ephemeral-worktree recovery behavior.

#### Scenario: Root discovery includes source

- **WHEN** a user views root help or requests root shell completion candidates
- **THEN** `source` is included as a public top-level command

#### Scenario: Source operation completion is requested

- **WHEN** a user requests completion after `chc source`
- **THEN** candidates include `list`, `current`, `use`, and `register`

#### Scenario: Dynamic source completion is requested

- **WHEN** a user requests completion for the selector after `chc source use`
- **THEN** candidates include available static selectors and currently discovered worktree ids
- **AND** discovery failures do not prompt or emit noisy diagnostics

#### Scenario: Worktree source lifecycle is documented

- **WHEN** a developer reads the CLI source-switching documentation
- **THEN** it explains that source switching does not build or update a worktree
- **AND** it shows how to refresh `apps/cli/dist/index.js`
- **AND** it instructs the developer to switch away before deleting an active worktree

#### Scenario: Active worktree was removed

- **WHEN** the globally linked worktree has already been deleted and `chc` can no longer start
- **THEN** the documentation provides the public Bash and PowerShell remote installer commands as the recovery path
