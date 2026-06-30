## MODIFIED Requirements

### Requirement: Root lint gate passes for managed workspace
The root workspace SHALL provide a lint command that validates all root-managed source files under `apps/*` and `packages/*` without failing on supported syntax used by those packages.

#### Scenario: Root lint succeeds
- **WHEN** a developer runs `pnpm run lint` from the repository root after dependencies are installed
- **THEN** the command exits successfully for the root-managed workspace
- **AND** supported package syntax such as Tailwind CSS directives does not cause parser failures

#### Scenario: Root-managed workspace is linted by root command
- **WHEN** the root lint command is inspected
- **THEN** it targets the root-managed workspace under `apps/*` and `packages/*`
- **AND** it does not depend on deleted scratch workspace paths

### Requirement: Generated outputs are excluded from validation inputs
Root-managed validation SHALL exclude generated output directories from source validation inputs while preserving those outputs for cache and reporting consumers.

#### Scenario: Typecheck ignores generated outputs
- **WHEN** a developer runs `pnpm run typecheck` after generated outputs such as `coverage`, `dist`, `out`, `.next`, or `.astro` exist under root-managed packages
- **THEN** typecheck commands do not inspect generated output files as source files
- **AND** generated coverage report assets do not produce type diagnostics

#### Scenario: Lint ignores generated outputs
- **WHEN** a developer runs `pnpm run lint` after generated outputs exist under `apps/*` or `packages/*`
- **THEN** the lint command does not inspect generated output files
- **AND** source files under root-managed packages remain linted

#### Scenario: Test discovery ignores generated outputs
- **WHEN** package runtime test commands run after coverage or build outputs exist
- **THEN** test discovery only includes intended test files
- **AND** generated report or build files are not executed as tests

#### Scenario: Coverage outputs remain publishable
- **WHEN** coverage commands generate reports under package `coverage` directories
- **THEN** those outputs remain available for Turbo outputs, CI artifact upload, PR coverage comments, and Codecov inputs
- **AND** the outputs are not treated as source validation inputs

#### Scenario: Generated-output policy preserves workspace boundary
- **WHEN** root engineering contract tests inspect generated-output exclusions
- **THEN** the policy applies to root-managed packages under `apps/*` and `packages/*`
- **AND** it does not rely on deleted scratch workspace paths

### Requirement: Workspace package script contract
Each root workspace package SHALL expose the standard scripts needed by root orchestration, and those scripts SHALL have meaningful validation behavior while preserving direct package command usability.

#### Scenario: Required scripts are present
- **WHEN** package manifests under `apps/*` and `packages/*` are inspected
- **THEN** each package exposes `build`, `test`, `test:cov`, `typecheck`, and `lint`
- **AND** package `test` scripts execute real runtime tests
- **AND** package `typecheck` scripts include type-only contract checks where those contracts exist
- **AND** package `test:cov` scripts produce package-local coverage artifacts for runtime tests or delegate to a documented runtime test coverage command
- **AND** any package test layer scripts use meaningful executable test commands rather than placeholders
- **AND** no standard validation script succeeds only by printing that validation is not configured

#### Scenario: Root commands remain canonical
- **WHEN** a developer verifies the root workspace after dependency installation
- **THEN** root commands for lint, typecheck, build, tests, and coverage orchestrate the root workspace without requiring package-specific command knowledge
- **AND** optional package test layer scripts do not replace the canonical root `test` command

#### Scenario: Package commands remain usable outside root orchestration
- **WHEN** a developer runs a standard validation script for a single root-managed package
- **THEN** the package script remains directly runnable or explicitly documents any Turbo-provided prerequisite
- **AND** root orchestration optimizations do not silently remove the package's local development workflow

### Requirement: Root workspace boundary is explicit
The root workspace configuration and contract checks SHALL make the boundary of root-managed packages explicit.

#### Scenario: Root workspace package globs stay focused
- **WHEN** `pnpm-workspace.yaml` is inspected at the repository root
- **THEN** it includes root package globs for `apps/*` and `packages/*`
- **AND** it does not include deleted scratch workspace paths

#### Scenario: Boundary regressions are caught
- **WHEN** root engineering contract tests run
- **THEN** they verify that root workspace orchestration is limited to root-managed `apps/*` and `packages/*` packages

### Requirement: Root workspace validation uses Turbo orchestration
Root package validation SHALL use Turborepo task orchestration for workspace package tasks so packages run in parallel while respecting workspace dependency order.

#### Scenario: Standard package tasks route through Turbo
- **WHEN** root validation commands for lint, typecheck, test, coverage, or build are inspected
- **THEN** package-level workspace execution is delegated to Turborepo tasks
- **AND** the commands preserve the explicit root workspace boundary for `apps/*` and `packages/*`

#### Scenario: Turbo dependency graph is used for package builds
- **WHEN** root build validation runs in CI
- **THEN** Turborepo schedules package builds according to declared task dependencies
- **AND** dependent packages build after their workspace dependencies when those dependencies are required
