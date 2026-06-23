## ADDED Requirements

### Requirement: Turbo validation orchestration is explicit
The root Turbo configuration SHALL declare the cross-package dependency relationships needed by root-managed validation commands instead of relying only on package scripts to perform dependency builds during root orchestration.

#### Scenario: Root validation tasks declare upstream dependencies
- **WHEN** the root Turbo configuration is inspected
- **THEN** validation tasks such as `typecheck`, `test`, and `test:cov` declare the upstream tasks they require for root-managed packages
- **AND** those dependency declarations are visible in `turbo.json`

#### Scenario: Root validation keeps full package coverage
- **WHEN** a developer runs root validation commands such as `pnpm run test` or `pnpm run test:cov`
- **THEN** Turbo orchestration runs the full package validation surface required by the corresponding package scripts
- **AND** optimization does not narrow root validation to only a subset of package tests

#### Scenario: Test layer tasks are orchestrable when present
- **WHEN** root-managed packages expose standardized test layer scripts
- **THEN** Turbo configuration either orchestrates those layer scripts explicitly or keeps them delegated through the package `test` command
- **AND** root `test` behavior remains the canonical full validation gate

### Requirement: Package validation commands remain directly runnable
Root-managed package scripts SHALL remain usable for targeted local development even when root orchestration moves dependency ordering into Turbo.

#### Scenario: Filtered package tests remain usable
- **WHEN** a developer runs a package test through a direct package command or `pnpm --filter <package> test`
- **THEN** the command has the dependency build behavior or source aliases it needs to run successfully outside the root Turbo graph
- **AND** the command does not require undocumented manual prebuild steps

#### Scenario: Filtered package typecheck remains usable
- **WHEN** a developer runs a package typecheck through a direct package command or `pnpm --filter <package> typecheck`
- **THEN** the command has the dependency build behavior or source references it needs to run successfully outside the root Turbo graph
- **AND** the command does not require package-specific command knowledge beyond the standard package script

#### Scenario: Package scripts document intentional Turbo-only assumptions
- **WHEN** a package validation script intentionally relies on Turbo-provided upstream builds
- **THEN** that reliance is captured in root engineering contracts or package documentation
- **AND** the package is not silently broken for direct local use

### Requirement: Turbo optimization preserves validation observability
Changes to root-managed Turbo orchestration SHALL preserve validation outputs, cache declarations, and debuggability.

#### Scenario: Task outputs remain declared
- **WHEN** Turbo validation tasks produce durable artifacts such as build outputs or coverage reports
- **THEN** the corresponding Turbo task declares those outputs
- **AND** the declarations remain compatible with CI artifact upload and coverage consumers

#### Scenario: Orchestration assumptions are contract-tested
- **WHEN** root engineering contract tests inspect root scripts and Turbo configuration
- **THEN** they verify the required root validation task dependencies
- **AND** they verify that root scripts continue to delegate validation through Turbo

#### Scenario: Optimization is behavior-verified
- **WHEN** the Turbo orchestration implementation is completed
- **THEN** root lint, typecheck, test, and coverage commands are run from the repository root
- **AND** the implementation records the relevant command behavior or graph change without requiring a strict timing threshold

## MODIFIED Requirements

### Requirement: Turbo task outputs are declared
The root Turbo configuration SHALL declare durable outputs for tasks that produce build or coverage artifacts and SHALL declare validation dependency relationships needed for root-managed orchestration.

#### Scenario: Build outputs are cacheable
- **WHEN** the root Turbo configuration is inspected
- **THEN** the `build` task declares output paths for package build artifacts
- **AND** the output paths include current framework and package output directories used by root workspace packages

#### Scenario: Coverage outputs are cacheable
- **WHEN** the root Turbo configuration is inspected
- **THEN** the `test:cov` task declares coverage output paths
- **AND** coverage output paths are scoped to generated package-local coverage artifacts
- **AND** coverage output paths are compatible with root, app, and package coverage artifact collection

#### Scenario: Validation dependencies are reviewable
- **WHEN** the root Turbo configuration is inspected
- **THEN** validation tasks that require upstream package artifacts declare those dependencies through Turbo task configuration
- **AND** the dependency graph does not rely only on hidden package-script coupling for root orchestration

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
- **AND** root commands preserve the explicit boundary that excludes `scratches/collection-hub`
- **AND** optional package test layer scripts do not replace the canonical root `test` command

#### Scenario: Package commands remain usable outside root orchestration
- **WHEN** a developer runs a standard validation script for a single root-managed package
- **THEN** the package script remains directly runnable or explicitly documents any Turbo-provided prerequisite
- **AND** root orchestration optimizations do not silently remove the package's local development workflow
