## ADDED Requirements

### Requirement: Test layer scripts are standardized
Root-managed packages SHALL use a consistent test layer script vocabulary when they expose narrower test commands in addition to the package `test` script.

#### Scenario: Approved layer script names are used
- **WHEN** root engineering contract tests inspect package manifests under `apps/*` and `packages/*`
- **THEN** any package-level test layer scripts use approved names such as `test:unit`, `test:integration`, or `test:e2e`
- **AND** packages do not introduce ad hoc layer names for the same concepts

#### Scenario: Empty layers are not required
- **WHEN** a root-managed package has no meaningful tests for a specific layer
- **THEN** the package is not required to expose a placeholder script for that layer
- **AND** no layer script succeeds only by printing that the layer is not configured

### Requirement: Layer scripts preserve package runner policy
Test layer scripts SHALL use the same runner family as the package's runtime test policy.

#### Scenario: CLI layer scripts use Bun
- **WHEN** the `@cthutool/cli` package exposes test layer scripts
- **THEN** those layer scripts run Bun test
- **AND** they do not migrate CLI runtime tests to Vitest

#### Scenario: Non-CLI layer scripts use Vitest
- **WHEN** a non-CLI root-managed runtime package exposes test layer scripts
- **THEN** those layer scripts run Vitest
- **AND** they follow the same non-CLI runner policy as the package `test` script

### Requirement: Package test remains the full default
For root-managed packages that expose test layer scripts, the package `test` script SHALL remain the canonical full package test command unless an explicit documented exception is added.

#### Scenario: Layered package test runs all intended layers
- **WHEN** a root-managed package exposes multiple test layer scripts
- **THEN** its `test` script runs the full intended package test surface
- **AND** the `test` script is not narrowed to only one layer by accident

#### Scenario: Root test remains broad
- **WHEN** a developer runs `pnpm run test` from the repository root
- **THEN** root orchestration continues to run full package test commands
- **AND** introducing layer scripts does not weaken the root test gate

### Requirement: CLI and backend expose initial test layers
The first root-managed packages with standardized test layer scripts SHALL be `@cthutool/cli` and `@cthutool/backend`, because they already have meaningful unit, integration, or e2e boundaries.

#### Scenario: CLI exposes unit and integration layers
- **WHEN** the `@cthutool/cli` package manifest is inspected
- **THEN** it exposes Bun-based commands for unit tests and integration tests
- **AND** its full `test` script covers both CLI layers

#### Scenario: Backend exposes source and e2e layers
- **WHEN** the `@cthutool/backend` package manifest is inspected
- **THEN** it exposes Vitest-based commands for source-level specs and e2e specs
- **AND** its full `test` script covers both backend layers

#### Scenario: Other packages are not forced into placeholders
- **WHEN** root engineering contract tests inspect smaller packages with only one meaningful runtime test surface
- **THEN** those packages may keep only the full `test` script
- **AND** they are not required to add empty `test:unit`, `test:integration`, or `test:e2e` scripts

## MODIFIED Requirements

### Requirement: Workspace package script contract
Each root workspace package SHALL expose the standard scripts needed by root orchestration, and those scripts SHALL have meaningful validation behavior.

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
