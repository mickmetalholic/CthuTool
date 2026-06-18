# apps-root-engineering-config Specification

## Purpose
TBD - created by archiving change apps-root-engineering-config-governance. Update Purpose after archive.
## Requirements
### Requirement: Root lint gate passes for managed workspace
The root workspace SHALL provide a lint command that validates all root-managed source files under `apps/*` and `packages/*` without failing on supported syntax used by those packages.

#### Scenario: Root lint succeeds
- **WHEN** a developer runs `pnpm run lint` from the repository root after dependencies are installed
- **THEN** the command exits successfully for the root-managed workspace
- **AND** supported package syntax such as Tailwind CSS directives does not cause parser failures

#### Scenario: Experimental workspace is not linted by root command
- **WHEN** the root lint command is inspected
- **THEN** it targets the root-managed workspace under `apps/*` and `packages/*`
- **AND** it does not require `scratches/collection-hub` files to satisfy the root lint gate

### Requirement: CI typecheck gate
The primary CI check workflow SHALL run the root typecheck command as a required quality gate.

#### Scenario: Pull request runs typecheck
- **WHEN** the CI check workflow runs for a pull request
- **THEN** it installs dependencies
- **AND** it runs `pnpm run lint`
- **AND** it runs `pnpm run typecheck`
- **AND** it runs `pnpm run test`

#### Scenario: Main branch push runs typecheck
- **WHEN** the CI check workflow runs for a push to `main`
- **THEN** it runs `pnpm run typecheck` before the check job succeeds

### Requirement: Turbo task outputs are declared
The root Turbo configuration SHALL declare durable outputs for tasks that produce build or coverage artifacts.

#### Scenario: Build outputs are cacheable
- **WHEN** the root Turbo configuration is inspected
- **THEN** the `build` task declares output paths for package build artifacts
- **AND** the output paths include current framework and package output directories used by root workspace packages

#### Scenario: Coverage outputs are cacheable
- **WHEN** the root Turbo configuration is inspected
- **THEN** the `test:cov` task declares coverage output paths
- **AND** coverage output paths are scoped to generated coverage artifacts

### Requirement: Workspace package script contract
Each root workspace package SHALL expose the standard scripts needed by root orchestration unless a documented package exception applies.

#### Scenario: Required scripts are present
- **WHEN** package manifests under `apps/*` and `packages/*` are inspected
- **THEN** each package exposes `build`, `test`, `test:cov`, `typecheck`, and `lint`
- **AND** packages without meaningful work for a standard script use an explicit no-op or a documented equivalent

#### Scenario: Root commands remain canonical
- **WHEN** a developer verifies the root workspace after dependency installation
- **THEN** root commands for lint, typecheck, build, and tests orchestrate the root workspace without requiring package-specific command knowledge

### Requirement: Root workspace boundary is explicit
The root workspace configuration and contract checks SHALL make the boundary between root-managed packages and experimental nested workspaces explicit.

#### Scenario: Root workspace package globs stay focused
- **WHEN** `pnpm-workspace.yaml` is inspected at the repository root
- **THEN** it includes root package globs for `apps/*` and `packages/*`
- **AND** it does not include `scratches/collection-hub`

#### Scenario: Boundary regressions are caught
- **WHEN** root engineering contract tests run
- **THEN** they verify that root workspace orchestration does not accidentally absorb `scratches/collection-hub`

