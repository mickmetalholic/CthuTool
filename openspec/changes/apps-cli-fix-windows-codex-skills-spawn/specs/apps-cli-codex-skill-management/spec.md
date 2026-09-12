## ADDED Requirements

### Requirement: Shell-free Windows skills backend invocation

The CLI SHALL start the pinned `npx skills` backend on Windows without passing an npm `.cmd` shim to Node's `execFile` or flattening backend arguments into a shell command.

#### Scenario: Windows skill inventory starts the pinned backend

- **WHEN** a Windows user runs `chc codex skills` or its read-only `--json` form
- **THEN** the command launches the pinned `skills` CLI through the active Node installation
- **AND** the list arguments reach the backend as distinct arguments
- **AND** the command can report the installed-skill inventory without `spawn EINVAL`

#### Scenario: Windows lifecycle invocation preserves backend arguments

- **WHEN** a confirmed skill lifecycle action calls the pinned backend on Windows
- **THEN** the selected source, selector, global Codex scope, and confirmation arguments reach the backend as distinct arguments
- **AND** the invocation does not require a command shell
