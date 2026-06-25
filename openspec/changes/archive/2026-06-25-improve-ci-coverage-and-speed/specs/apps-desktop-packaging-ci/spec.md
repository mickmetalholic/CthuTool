## ADDED Requirements

### Requirement: Desktop artifact workflow tracks desktop dependency changes
The desktop artifact workflow SHALL run when changes affect the desktop package or root-managed packages that contribute to the desktop build.

#### Scenario: Desktop dependency package changes trigger artifacts workflow
- **WHEN** a pull request changes `apps/desktop/**`, `packages/agent-protocol/**`, `packages/app-shell/**`, or `packages/ui/**`
- **THEN** the desktop artifact workflow is eligible to run
- **AND** the workflow validates desktop packaging before the pull request is considered artifact-ready

#### Scenario: Shared workspace configuration changes trigger artifacts workflow
- **WHEN** a pull request changes root package manifests, workspace configuration, lockfile, Turbo configuration, or the desktop artifact workflow itself
- **THEN** the desktop artifact workflow is eligible to run

### Requirement: Desktop validation uses Turbo filtered dependency graph
The desktop artifact workflow SHALL validate the desktop package through the Turborepo dependency graph before running platform-specific packaging commands.

#### Scenario: Desktop graph validation runs before packaging
- **WHEN** the desktop artifact workflow runs
- **THEN** it installs dependencies with the frozen lockfile
- **AND** it restores Turbo task cache before Turbo validation tasks
- **AND** it runs typecheck, test, and build validation for `@cthutool/desktop` and its workspace dependency graph
- **AND** platform-specific packaging runs only after graph validation succeeds

#### Scenario: Platform packaging avoids redundant rebuilds
- **WHEN** desktop graph build validation has already produced the package build output
- **THEN** Windows and macOS packaging commands reuse the existing build output where package scripts support it
- **AND** the workflow does not intentionally rebuild the same desktop output more than once per platform job
