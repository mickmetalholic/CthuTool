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

### Requirement: Root workspace boundary is explicit
The root workspace configuration and contract checks SHALL make the boundary between root-managed packages and experimental nested workspaces explicit.

#### Scenario: Root workspace package globs stay focused
- **WHEN** `pnpm-workspace.yaml` is inspected at the repository root
- **THEN** it includes root package globs for `apps/*` and `packages/*`
- **AND** it does not include `scratches/collection-hub`

#### Scenario: Boundary regressions are caught
- **WHEN** root engineering contract tests run
- **THEN** they verify that root workspace orchestration does not accidentally absorb `scratches/collection-hub`

### Requirement: OpenSpec project guidance is configured
The repository SHALL configure OpenSpec project context and artifact rules so
future OpenSpec artifact generation follows repository-specific naming, scope,
and generated-adapter policies.

#### Scenario: OpenSpec config carries repository context
- **WHEN** `openspec/config.yaml` is inspected
- **THEN** it defines project context for OpenSpec artifact generation
- **AND** the context includes monorepo area-prefix naming expectations for
  `openspec/specs/<capability>` directories
- **AND** the context states that generated agent adapter instructions under
  `.claude/`, `.codex/`, and `.cursor/` should be regenerated rather than
  hand-edited for project policy

#### Scenario: Artifact rules constrain future changes
- **WHEN** `openspec/config.yaml` is inspected
- **THEN** it defines artifact rules for proposals, specs, designs, and tasks
- **AND** those rules keep each OpenSpec change scoped to one task or change
- **AND** those rules prevent archiving, syncing, or committing neighboring
  OpenSpec changes unless explicitly requested

### Requirement: CLI dist pre-commit refresh
The root engineering configuration SHALL refresh and stage the committed CLI runtime bundle during pre-commit when staged files can affect `apps/cli/dist/index.js`.

#### Scenario: CLI source commit refreshes dist
- **WHEN** a developer attempts to commit staged changes under `apps/cli/src`
- **THEN** the pre-commit flow runs the CLI build
- **AND** it stages `apps/cli/dist/index.js`
- **AND** it verifies the committed CLI bundle is current before allowing the commit to proceed

#### Scenario: CLI build input commit refreshes dist
- **WHEN** a developer attempts to commit staged changes to CLI bundle-affecting metadata such as `apps/cli/package.json`, root package manager metadata, or CLI build configuration
- **THEN** the pre-commit flow runs the CLI build
- **AND** it stages `apps/cli/dist/index.js`
- **AND** it verifies the committed CLI bundle is current before allowing the commit to proceed

#### Scenario: Unrelated commit skips CLI build
- **WHEN** a developer attempts to commit staged changes that cannot affect the CLI runtime bundle
- **THEN** the pre-commit flow does not run the CLI build only for the CLI dist safeguard

#### Scenario: Bundle refresh failure blocks commit
- **WHEN** the CLI build, generated-bundle staging, or bundle freshness check fails during pre-commit
- **THEN** the commit is blocked
- **AND** the developer receives a clear diagnostic describing the failed step

#### Scenario: Generated dist is not formatted as source
- **WHEN** the pre-commit flow stages `apps/cli/dist/index.js`
- **THEN** generated bundle staging does not cause source-formatting hooks to fail because the generated bundle is ignored by the source formatter

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
