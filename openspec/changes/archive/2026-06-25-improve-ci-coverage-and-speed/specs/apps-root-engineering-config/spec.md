## ADDED Requirements

### Requirement: Primary CI validates complete root workspace health
The primary CI workflow SHALL validate the complete health of root-managed workspace packages before a pull request or main branch push is considered successful.

#### Scenario: Pull request runs complete validation
- **WHEN** the primary CI workflow runs for a pull request
- **THEN** it installs dependencies with the frozen lockfile
- **AND** it validates commit messages for the pull request range
- **AND** it runs root-managed lint validation
- **AND** it runs root-managed typecheck validation
- **AND** it runs root-managed runtime tests
- **AND** it runs root-managed build validation
- **AND** it runs the CLI distribution integrity check

#### Scenario: Main branch push runs complete validation
- **WHEN** the primary CI workflow runs for a push to `main`
- **THEN** it validates commit messages for the pushed commit
- **AND** it runs root-managed lint, typecheck, test, build, and CLI distribution gates before required CI succeeds

### Requirement: Root workspace validation uses Turbo orchestration
Root package validation SHALL use Turborepo task orchestration for workspace package tasks so packages run in parallel while respecting workspace dependency order.

#### Scenario: Standard package tasks route through Turbo
- **WHEN** root validation commands for lint, typecheck, test, coverage, or build are inspected
- **THEN** package-level workspace execution is delegated to Turborepo tasks
- **AND** the commands preserve the explicit root workspace boundary for `apps/*` and `packages/*`
- **AND** the commands do not require `scratches/collection-hub` packages to participate in root CI

#### Scenario: Turbo dependency graph is used for package builds
- **WHEN** root build validation runs in CI
- **THEN** Turborepo schedules package builds according to declared task dependencies
- **AND** dependent packages build after their workspace dependencies when those dependencies are required

### Requirement: GitHub Actions persists Turbo task cache
GitHub Actions workflows that run Turborepo package tasks SHALL restore and save the Turborepo local task cache in addition to caching pnpm dependencies.

#### Scenario: Turbo cache is restored before task execution
- **WHEN** a CI job runs Turborepo package tasks
- **THEN** the workflow restores `.turbo/cache` before those tasks execute
- **AND** the cache key includes runner context and the current Git reference or commit identity
- **AND** restore keys allow reuse from nearby runs when exact cache keys are not available

#### Scenario: pnpm dependency cache remains configured
- **WHEN** Node.js is set up in CI
- **THEN** pnpm store caching remains enabled
- **AND** Turbo task caching is configured separately from pnpm dependency caching

### Requirement: Root CI permissions are scoped to job needs
Primary CI permissions SHALL be assigned at the narrowest practical scope for each job.

#### Scenario: Validation jobs use read-only repository access
- **WHEN** lint, typecheck, test, build, or CLI distribution jobs run
- **THEN** they use read-only repository contents permissions
- **AND** they do not receive package publishing, pull request write, or OIDC token permissions

#### Scenario: Coverage job receives only required write permissions
- **WHEN** the coverage job comments on a pull request or uploads coverage with OIDC
- **THEN** only that job receives the write and OIDC permissions needed for those actions

### Requirement: Workspace script contracts cover standard validation scripts
Root engineering contract tests SHALL verify that each root-managed workspace package exposes meaningful standard validation scripts.

#### Scenario: Required validation scripts are enforced
- **WHEN** root engineering contract tests inspect package manifests under `apps/*` and `packages/*`
- **THEN** every package exposes `lint`, `typecheck`, `test`, `test:cov`, and `build`
- **AND** standard validation scripts do not succeed only by printing that validation is not configured
- **AND** persistent, watch, interactive, or local hook scripts are not required to run in CI

#### Scenario: Root CI contract reflects required gates
- **WHEN** root engineering contract tests inspect the primary CI workflow
- **THEN** the workflow is required to include lint, typecheck, test, build, CLI distribution, and coverage validation
- **AND** the contract distinguishes required correctness gates from non-blocking external coverage upload behavior when applicable
