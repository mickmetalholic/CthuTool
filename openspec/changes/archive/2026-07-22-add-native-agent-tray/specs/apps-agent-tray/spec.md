## ADDED Requirements

### Requirement: Windowless native tray presence
The product SHALL provide a single user-session native tray process without an application window, embedded browser, or WebView.

#### Scenario: Tray starts normally
- **WHEN** the installed tray starts in a supported user session
- **THEN** one tray icon becomes available and the bundled Agent is supervised without opening a desktop window

#### Scenario: A second tray is started
- **WHEN** another compatible tray invocation finds the authoritative healthy instance
- **THEN** it asks that instance to open CthuTool and exits without spawning another Agent

### Requirement: Minimal environment-aware menu
The tray SHALL expose a status line, Open CthuTool, an Environment submenu with exactly one active configured environment, and Exit, and SHALL NOT expose pause, stop-task-only, or keep-tray-only modes.

#### Scenario: Menu opens
- **WHEN** the user opens the tray menu
- **THEN** it shows Agent/backend state, the active environment, Open CthuTool, configured environment choices, and Exit

#### Scenario: Environment changes
- **WHEN** the user chooses a different valid environment
- **THEN** the tray invokes the Agent environment-switch contract, displays transitional state, and checks the new environment only after it becomes authoritative

#### Scenario: Environment switch fails
- **WHEN** a switch request is invalid before activation or the activated target cannot authenticate/connect
- **THEN** the tray reports an actionable error, retains the prior selection only for pre-activation rejection, and otherwise shows the target selected in degraded state without automatic fallback

### Requirement: Deployed Web launch
The tray SHALL open the active environment's deployed Web application in the default browser using a newly issued one-time local-bridge bootstrap fragment.

#### Scenario: Open CthuTool succeeds
- **WHEN** the Agent bridge is ready and the user activates Open CthuTool
- **THEN** the tray opens the exact configured same-origin Agent-console URL with endpoint, ticket, and environment in the URL fragment and does not persist the ticket

#### Scenario: Primary tray gesture is available
- **WHEN** the platform supplies the supported primary activation gesture
- **THEN** Windows double-click or macOS primary click performs the same Open CthuTool action as the menu

#### Scenario: Bridge launch cannot be issued
- **WHEN** the local bridge is unavailable or the Agent is not ready
- **THEN** the tray remains running and presents bounded degraded/error status rather than opening an unauthenticated URL

### Requirement: Bounded Agent supervision
The tray SHALL supervise one exact bundled Agent child, distinguish backend disconnection from process failure, and bound automatic restart attempts.

#### Scenario: Agent exits unexpectedly
- **WHEN** the exact supervised child exits outside coordinated shutdown
- **THEN** the tray restarts it with exponential backoff within a crash-window budget

#### Scenario: Restart budget is exhausted
- **WHEN** child failures exceed the configured crash-window limit
- **THEN** the tray stops restarting, remains visible in a latched error state, and retains Exit and any safe diagnostics/open actions

#### Scenario: Backend disconnects
- **WHEN** the Agent process is healthy but its active backend connection is offline
- **THEN** the tray reports degraded/backend-offline status without restarting the child

### Requirement: Safe same-user instance control
The tray SHALL protect local supervision with user-scoped IPC and SHALL validate executable, PID, random instance nonce, and protocol compatibility before controlling or terminating a process.

#### Scenario: Stale instance metadata is found
- **WHEN** recorded process or handshake identity does not match the running process
- **THEN** the tray does not signal that process and recovers the stale record safely

#### Scenario: Compatible same-user child becomes ready
- **WHEN** the bundled Agent establishes the protected local channel with matching instance identity and protocol version
- **THEN** the tray accepts readiness without storing a reusable local-control credential

### Requirement: Coordinated complete exit
Exit SHALL stop the Agent and tray together after graceful browser-context and profile-lock cleanup, with forced termination limited to the exact child after a timeout.

#### Scenario: User chooses Exit
- **WHEN** the user selects Exit from the tray
- **THEN** new commands are rejected, active work is drained or cancelled, controlled browser contexts close, profile locks release, and both Agent and tray terminate

#### Scenario: Graceful shutdown times out
- **WHEN** the exact supervised child does not exit within the bounded shutdown interval
- **THEN** the tray revalidates child identity before forced termination and never kills a process that only shares a name or reused PID
