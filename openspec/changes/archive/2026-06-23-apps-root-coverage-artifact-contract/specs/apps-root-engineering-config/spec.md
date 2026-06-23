## ADDED Requirements

### Requirement: Coverage artifacts use stable package-local paths
Root-managed runtime test suites with coverage support SHALL write coverage
artifacts to stable package-local `coverage/` directories.

#### Scenario: Vitest package coverage artifacts are stable
- **WHEN** a non-CLI root-managed runtime package runs its `test:cov` script
- **THEN** the package produces `coverage/lcov.info`
- **AND** the package produces `coverage/coverage-summary.json`
- **AND** those artifacts are written under the package-local `coverage/` directory

#### Scenario: CLI Bun coverage artifacts are stable
- **WHEN** the `@cthutool/cli` package runs its `test:cov` script
- **THEN** it runs Bun coverage
- **AND** it produces package-local `coverage/lcov.info`
- **AND** it is not required to produce Vitest-specific coverage summary output

#### Scenario: Coverage artifacts remain generated output
- **WHEN** coverage artifacts are produced by root or package coverage commands
- **THEN** validation tools treat those artifacts as generated output
- **AND** coverage artifacts are not required to be committed as source files

### Requirement: Coverage artifact contracts are enforced
Root engineering contract tests SHALL verify that coverage scripts and CI
coverage consumers agree on the expected artifact paths.

#### Scenario: Package coverage scripts are real coverage commands
- **WHEN** root engineering contract tests inspect package manifests under `apps/*` and `packages/*`
- **THEN** runtime packages expose `test:cov` scripts that execute coverage-producing test runners
- **AND** those scripts do not succeed only by printing that coverage is not configured

#### Scenario: CI coverage consumers use declared artifacts
- **WHEN** root engineering contract tests inspect coverage workflow configuration
- **THEN** artifact upload paths include root, app, and package coverage outputs
- **AND** Codecov file inputs include root, app, and package `lcov.info` files
- **AND** PR comment coverage summary collection uses the same package-local coverage summary paths where summary files are expected

## MODIFIED Requirements

### Requirement: Turbo task outputs are declared
The root Turbo configuration SHALL declare durable outputs for tasks that produce build or coverage artifacts.

#### Scenario: Build outputs are cacheable
- **WHEN** the root Turbo configuration is inspected
- **THEN** the `build` task declares output paths for package build artifacts
- **AND** the output paths include current framework and package output directories used by root workspace packages

#### Scenario: Coverage outputs are cacheable
- **WHEN** the root Turbo configuration is inspected
- **THEN** the `test:cov` task declares coverage output paths
- **AND** coverage output paths are scoped to generated package-local coverage artifacts
- **AND** coverage output paths are compatible with root, app, and package coverage artifact collection

### Requirement: Coverage outputs are visible for runtime test suites
The root coverage workflow SHALL collect coverage artifacts for root-managed runtime test suites that support coverage and SHALL avoid fake coverage success for packages without runtime coverage.

#### Scenario: Coverage job publishes package outputs
- **WHEN** the CI coverage job runs
- **THEN** it generates repository coverage
- **AND** it uploads coverage artifacts for root contract tests and root-managed packages with runtime coverage output
- **AND** uploaded coverage artifacts include package-local `coverage/lcov.info` files for runtime packages with coverage support

#### Scenario: Coverage comments identify package coverage
- **WHEN** the CI coverage job comments on a pull request
- **THEN** the comment reports coverage for each collected package coverage summary
- **AND** packages without runtime coverage are not represented by placeholder "No coverage configured" scripts
- **AND** missing expected summary artifacts for Vitest runtime packages are treated as configuration drift rather than silently ignored

#### Scenario: Codecov receives stable coverage inputs
- **WHEN** the CI coverage job uploads coverage to Codecov
- **THEN** Codecov file inputs include root coverage lcov output
- **AND** Codecov file inputs include app and package `coverage/lcov.info` outputs
- **AND** the upload configuration does not depend on package-specific ad hoc coverage paths

### Requirement: Workspace package script contract
Each root workspace package SHALL expose the standard scripts needed by root orchestration, and those scripts SHALL have meaningful validation behavior.

#### Scenario: Required scripts are present
- **WHEN** package manifests under `apps/*` and `packages/*` are inspected
- **THEN** each package exposes `build`, `test`, `test:cov`, `typecheck`, and `lint`
- **AND** package `test` scripts execute real runtime tests
- **AND** package `typecheck` scripts include type-only contract checks where those contracts exist
- **AND** package `test:cov` scripts produce package-local coverage artifacts for runtime tests or delegate to a documented runtime test coverage command
- **AND** no standard validation script succeeds only by printing that validation is not configured

#### Scenario: Root commands remain canonical
- **WHEN** a developer verifies the root workspace after dependency installation
- **THEN** root commands for lint, typecheck, build, tests, and coverage orchestrate the root workspace without requiring package-specific command knowledge
- **AND** root commands preserve the explicit boundary that excludes `scratches/collection-hub`
