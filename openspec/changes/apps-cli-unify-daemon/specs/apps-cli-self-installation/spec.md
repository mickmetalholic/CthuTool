## ADDED Requirements

### Requirement: Unified CLI and daemon payload
The root-installed chc package SHALL include the daemon entrypoint and complete required runtime dependencies and resources under the existing Node 24 installation contract. Installing or updating chc SHALL NOT require an independent Agent download, a Rust build, a bundled second Node runtime, pnpm/Bun on the consumer host, or a local SDK/daemon compilation step.

#### Scenario: Clean host installs CLI
- **WHEN** a supported host with existing CLI prerequisites installs from committed prebuilt output
- **THEN** daemon setup/start/status resolve packaged entrypoints and production dependencies outside the source working directory

#### Scenario: Browser dependencies are inspected
- **WHEN** the installed CLI daemon payload is inspected
- **THEN** required Playwright/WebSocket code and runtime resources are present without a workspace node_modules fallback or automatic browser download
- **AND** host Chrome remains a documented external prerequisite

#### Scenario: Lightweight command runs
- **WHEN** help, version, source status, or shell completion is invoked
- **THEN** it remains usable without daemon configuration, Chrome, or a Playwright runtime initialization
