## ADDED Requirements

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
- **AND** it does not require `scratches/collection-hub` to follow root validation orchestration
