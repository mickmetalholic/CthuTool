## ADDED Requirements

### Requirement: Root test scripts execute real tests
Every root-managed package under `apps/*` and `packages/*` SHALL provide a `test` script that runs executable runtime tests for that package, except `@cthutool/cli` which SHALL run executable Bun tests.

#### Scenario: Placeholder tests are rejected
- **WHEN** root engineering contract tests inspect package manifests under `apps/*` and `packages/*`
- **THEN** no `test` script uses a command that only prints that tests are not configured
- **AND** no `test` script is an intentional no-op

#### Scenario: CLI keeps runtime-specific tests
- **WHEN** the `@cthutool/cli` package manifest is inspected
- **THEN** its `test` script runs Bun test
- **AND** root contract tests treat this as the only allowed non-Vitest runtime test exception

#### Scenario: Non-CLI packages use Vitest for runtime tests
- **WHEN** package manifests under `apps/*` and `packages/*` are inspected excluding `@cthutool/cli`
- **THEN** packages with runtime tests use Vitest for the package `test` script

### Requirement: Type-only contracts run through typecheck
Type-only public API and import contract checks SHALL run through `typecheck` rather than through package `test` scripts.

#### Scenario: Shared UI type contracts are typechecked
- **WHEN** root `pnpm run typecheck` executes
- **THEN** type-only contract files for shared UI packages are included in the package typecheck command
- **AND** those contracts do not require the package `test` script to run

#### Scenario: Test scripts are not typecheck-only
- **WHEN** root engineering contract tests inspect package `test` scripts
- **THEN** no package `test` script is satisfied only by `tsc --noEmit`

### Requirement: Coverage outputs are visible for runtime test suites
The root coverage workflow SHALL collect coverage artifacts for root-managed runtime test suites that support coverage and SHALL avoid fake coverage success for packages without runtime coverage.

#### Scenario: Coverage job publishes package outputs
- **WHEN** the CI coverage job runs
- **THEN** it generates repository coverage
- **AND** it uploads coverage artifacts for root contract tests and root-managed packages with runtime coverage output

#### Scenario: Coverage comments identify package coverage
- **WHEN** the CI coverage job comments on a pull request
- **THEN** the comment reports coverage for each collected package coverage summary
- **AND** packages without runtime coverage are not represented by placeholder "No coverage configured" scripts

## MODIFIED Requirements

### Requirement: Workspace package script contract
Each root workspace package SHALL expose the standard scripts needed by root orchestration, and those scripts SHALL have meaningful validation behavior.

#### Scenario: Required scripts are present
- **WHEN** package manifests under `apps/*` and `packages/*` are inspected
- **THEN** each package exposes `build`, `test`, `test:cov`, `typecheck`, and `lint`
- **AND** package `test` scripts execute real runtime tests
- **AND** package `typecheck` scripts include type-only contract checks where those contracts exist
- **AND** package `test:cov` scripts either produce coverage for runtime tests or delegate to a documented runtime test coverage command
- **AND** no standard validation script succeeds only by printing that validation is not configured

#### Scenario: Root commands remain canonical
- **WHEN** a developer verifies the root workspace after dependency installation
- **THEN** root commands for lint, typecheck, build, tests, and coverage orchestrate the root workspace without requiring package-specific command knowledge
- **AND** root commands preserve the explicit boundary that excludes `scratches/collection-hub`
