## 1. Baseline and Boundaries

- [x] 1.1 Add characterization tests for current agent registration/reconnect, browser commands, profile resolution, diagnostics, and shutdown behavior.
- [x] 1.2 Inventory Electron imports in `AgentClient`, `PlaywrightHost`, configuration, profiles, and observability and define the host-neutral module boundary.
- [x] 1.3 Create the headless agent workspace/package structure and add it to root workspace and targeted validation configuration.

## 2. Shared Runtime Extraction

- [x] 2.1 Extract configuration and user-data path resolution behind explicit adapters without moving existing data.
- [x] 2.2 Extract agent WebSocket connection and lifecycle code so it has no Electron imports and preserves protocol behavior.
- [x] 2.3 Extract Playwright browser hosting, profile ownership, and browser diagnostics behind an Electron-free runtime factory.
- [x] 2.4 Add structured redaction for runtime, connection, browser, and shutdown events, including tests for secret and raw-artifact exclusion.

## 3. Headless Process Lifecycle

- [x] 3.1 Implement the Node.js headless entry point and the starting/ready/degraded/stopping/stopped state model.
- [x] 3.2 Implement user-scoped instance/profile locks with validated stale-record recovery and duplicate-instance tests.
- [x] 3.3 Implement versioned health/status/shutdown over user-scoped socket or named-pipe IPC with instance-nonce and executable/PID validation.
- [x] 3.4 Implement signal and supervisor-driven graceful shutdown that stops command intake, closes browser contexts/connections, and releases locks.
- [x] 3.5 Add headless integration tests for backend outage, reconnect, host-Chrome unavailable, command bounds, and correlated results/errors.

## 4. Electron Compatibility

- [x] 4.1 Replace Electron main-process construction of agent/browser components with the shared runtime factory and Electron-specific adapters.
- [x] 4.2 Prevent Electron compatibility mode from starting a second browser host when the standalone runtime owns the profile root.
- [x] 4.3 Run parity tests separately in Electron and headless modes against the same protocol fixtures and confirm existing desktop behavior remains available.

## 5. Verification

- [x] 5.1 Run targeted lint, TypeScript checks, unit/integration tests, and `git diff --check` for affected runtime and desktop files.
- [x] 5.2 Run strict OpenSpec validation for `extract-local-agent-runtime` and verify every scenario has test or follow-up coverage.
- [x] 5.3 Confirm `.claude/`, `.codex/`, and `.cursor/` generated adapter files are unchanged and no unrelated OpenSpec change was modified.
