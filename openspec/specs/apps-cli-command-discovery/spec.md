# apps-cli-command-discovery Specification

## Purpose
Define shared static and dynamic CLI command registration and discovery so help, bare commands, and runtime resolution remain consistent.
## Requirements
### Requirement: Shared command registration
The CLI SHALL maintain one registration model for static command dispatch, visibility, help discovery, completion discovery, and bare-command behavior.

#### Scenario: Public command registration
- **WHEN** a static command is registered as public
- **THEN** the command is callable through the CLI dispatcher
- **AND** it is eligible to appear in help and shell completion from the same registration

#### Scenario: Compatibility command registration
- **WHEN** a static command is registered as a compatibility command
- **THEN** the command remains callable for existing users and scripts
- **AND** it is omitted from public help and shell completion

#### Scenario: Internal command registration
- **WHEN** a static command is registered as internal
- **THEN** the command remains callable by its internal protocol consumer
- **AND** it is omitted from public help and shell completion

### Requirement: Static command discovery consistency
Public static commands and nested operations SHALL derive their help and completion presence from the same Citty command definitions and registration visibility.

#### Scenario: Public static operation is discoverable
- **WHEN** a public static operation is offered as a completion candidate at a command path
- **THEN** the parent command help identifies the same operation

#### Scenario: Static operation is removed
- **WHEN** a public static operation is removed from its parent command definition
- **THEN** it no longer appears in dispatch, help, or completion without requiring a separate candidate-list edit

#### Scenario: Hidden operation stays hidden
- **WHEN** an internal or compatibility operation exists in the dispatch tree
- **THEN** help and completion omit it according to its registration visibility

### Requirement: Bare command behavior
Each registered top-level command SHALL declare whether a bare invocation renders help or runs its command handler.

#### Scenario: Bare command group renders help
- **WHEN** a user invokes a public command group whose bare behavior is `help`
- **THEN** the CLI renders the same group help used by the explicit `--help` form
- **AND** exits successfully without running a child operation

#### Scenario: Bare runnable command reaches its handler
- **WHEN** a user invokes a command whose bare behavior is `run`
- **THEN** the CLI reaches that command's normal validation or interactive behavior
- **AND** the entrypoint does not replace execution with a name-based help shortcut

### Requirement: Dynamic discovery provider
A command with dynamic targets SHALL use one discovery provider to supply human help, listing, shell completion, selection, and execution resolution.

#### Scenario: Dynamic targets remain consistent
- **WHEN** dynamic target discovery succeeds
- **THEN** help, explicit listing, completion, and execution resolution use the same discovered target ids and metadata

#### Scenario: Dynamic discovery fails during completion
- **WHEN** the discovery provider fails while serving the internal completion protocol
- **THEN** completion returns no dynamic candidates
- **AND** it does not emit interactive prompts or noisy diagnostics

#### Scenario: Dynamic discovery warns in human output
- **WHEN** discovery returns valid targets together with bounded warnings
- **THEN** human help or listing shows the valid targets
- **AND** reports actionable warnings without preventing valid targets from being used

### Requirement: Command discovery invariant tests
The CLI SHALL verify command-discovery consistency through automated tests rather than relying only on fixed output snapshots.

#### Scenario: Help and completion invariant
- **WHEN** the registered public static command tree is tested
- **THEN** every public static completion operation is represented by its parent help
- **AND** internal and compatibility operations are absent from both discovery surfaces

#### Scenario: Documented compatibility forms
- **WHEN** compatibility command forms are tested
- **THEN** they continue to dispatch successfully without becoming public discovery entries
