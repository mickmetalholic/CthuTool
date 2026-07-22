# apps-root-engineering-config Specification

## Purpose
Define root monorepo engineering configuration for validation scripts, CI gates, package governance, Turbo orchestration, generated adapter policy, and OpenSpec ownership.

## Requirements
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

#### Scenario: Test scripts are not typecheck-only
- **WHEN** root engineering contract tests inspect package `test` scripts
- **THEN** no package `test` script is satisfied only by `tsc --noEmit`

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

### Requirement: Coverage quality gates are package-aware
Root-managed runtime coverage quality gates SHALL be configured per package so mature test suites can block regressions without imposing premature thresholds on smoke-test-focused packages.

#### Scenario: Initial gated packages are explicit
- **WHEN** root engineering contract tests inspect coverage quality gate configuration
- **THEN** `@cthutool/backend`, `@cthutool/config`, `@cthutool/agent-protocol`, and `@cthutool/obsidian-enhancer` are listed as threshold-gated packages
- **AND** each listed package has explicit threshold values for the coverage metrics enforced by its test runner

#### Scenario: Visibility-only packages stay non-blocking
- **WHEN** root-managed runtime packages without coverage quality gates run coverage
- **THEN** they still produce and publish coverage artifacts according to the coverage artifact contract
- **AND** their coverage percentages do not fail CI solely because they are below a threshold

#### Scenario: No root aggregate threshold masks package regressions
- **WHEN** root coverage verification runs
- **THEN** threshold enforcement is based on package-local coverage results for threshold-gated packages
- **AND** a repository-wide aggregate coverage percentage is not the only quality gate

### Requirement: Coverage thresholds are conservative and reviewable
Coverage threshold values SHALL be explicit, conservative, and reviewable so they prevent large regressions while leaving room for normal refactoring noise.

#### Scenario: Threshold values are recorded in package configuration
- **WHEN** a threshold-gated package coverage configuration is inspected
- **THEN** the enforced coverage thresholds are visible in that package's runner configuration or an explicitly referenced coverage policy file
- **AND** the thresholds are not hidden in CI-only shell logic

#### Scenario: Thresholds are lower than or equal to recorded baseline intent
- **WHEN** a threshold is introduced or changed
- **THEN** the change records the baseline or rationale used to choose the threshold
- **AND** the initial threshold does not require immediate broad test rewrites for the package to pass

#### Scenario: Threshold failures identify ownership
- **WHEN** a threshold-gated package fails coverage verification
- **THEN** the command output or CI failure identifies the package and coverage metric that failed
- **AND** the failure can be investigated without reading combined coverage artifacts manually

### Requirement: Coverage gate graduation policy is documented
The repository SHALL document how root-managed packages move from visibility-only coverage to threshold-gated coverage.

#### Scenario: Graduation criteria are documented
- **WHEN** root engineering coverage policy documentation is inspected
- **THEN** it describes criteria for adding a package to the threshold-gated set
- **AND** the criteria include stable coverage artifact production, meaningful behavioral tests, and an agreed baseline

#### Scenario: New gates require contract updates
- **WHEN** a package is promoted to threshold-gated coverage
- **THEN** root engineering contract tests or policy data are updated to include that package
- **AND** CI coverage verification enforces the package's configured thresholds

#### Scenario: CLI runner differences remain explicit
- **WHEN** coverage gate policy discusses `@cthutool/cli`
- **THEN** it preserves Bun coverage as the CLI runner
- **AND** any future CLI threshold decision accounts for Bun coverage output differences instead of requiring Vitest-specific artifacts

### Requirement: CLI Bun coverage inputs are evaluated before gating
The CLI package SHALL evaluate its Bun coverage output before introducing any coverage threshold gate.

#### Scenario: CLI coverage baseline is recorded
- **WHEN** `@cthutool/cli` coverage is evaluated
- **THEN** the current Bun coverage baseline is recorded for statements or the metrics Bun reports
- **AND** the baseline identifies package-owned source coverage separately from generated or external paths where possible

#### Scenario: CLI coverage paths are classified
- **WHEN** coverage reports include bundled scripts, temporary execution paths, or external plugin scripts
- **THEN** the change documents whether those paths count toward CLI coverage
- **AND** any exclusions are explicit and narrow

### Requirement: CLI remains on Bun test
The CLI package SHALL preserve Bun test and Bun coverage as its runtime-specific validation path.

#### Scenario: CLI gate decision preserves Bun runner
- **WHEN** the CLI coverage gate decision is made
- **THEN** CLI test and coverage scripts continue to use Bun
- **AND** no Vitest migration is required to satisfy the coverage policy

### Requirement: CLI coverage gate decision is explicit
The CLI package SHALL explicitly document whether it remains visibility-only or graduates to a Bun-compatible coverage gate.

#### Scenario: CLI gate outcome is recorded
- **WHEN** CLI coverage evaluation is complete
- **THEN** the coverage policy records the gate decision and rationale
- **AND** any future threshold values are tied to Bun coverage output rather than Vitest-specific artifacts

### Requirement: Obsidian enhancer domain behavior is covered
The Obsidian enhancer package SHALL include behavior tests for its domain utilities and adapter-facing boundaries.

#### Scenario: Tag and exclusion logic is covered
- **WHEN** package tests exercise tag and excluded root utilities
- **THEN** they cover valid inputs, invalid inputs, empty inputs, and duplicate or normalized values
- **AND** expected normalization behavior is asserted

#### Scenario: Obsidian adapter boundaries are covered
- **WHEN** package behavior depends on Obsidian-facing APIs
- **THEN** tests use typed fakes or stable adapters
- **AND** tests do not require a live Obsidian application

### Requirement: Obsidian enhancer coverage graduation is evaluated
The Obsidian enhancer package SHALL record a coverage baseline and explicitly decide whether it becomes threshold-gated.

#### Scenario: Coverage gate decision is documented
- **WHEN** package coverage is expanded
- **THEN** the coverage policy records the baseline and gating decision
- **AND** any package-local thresholds are visible in runner configuration

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
The primary CI workflow SHALL validate the complete health of root-managed workspace packages before a pull request or main branch push is considered successful, while artifact-specific validation can live in dedicated area workflows.

#### Scenario: Pull request runs complete root validation
- **WHEN** the primary CI workflow runs for a pull request
- **THEN** it installs dependencies with the frozen lockfile
- **AND** it validates commit messages for the pull request range
- **AND** it runs root-managed lint validation
- **AND** it runs root-managed typecheck validation
- **AND** it runs root-managed runtime tests
- **AND** it runs root-managed build validation
- **AND** CLI distribution integrity is validated by the dedicated CLI distribution workflow rather than the primary CI workflow

#### Scenario: Main branch push runs complete root validation
- **WHEN** the primary CI workflow runs for a push to `main`
- **THEN** it validates commit messages for the pushed commit
- **AND** it runs root-managed lint, typecheck, test, and build gates before required CI succeeds
- **AND** CLI distribution integrity is validated by the dedicated CLI distribution workflow rather than the primary CI workflow

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

### Requirement: Pull request workflows cancel superseded runs
Pull request workflows SHALL cancel superseded runs for the same pull request or branch so repeated pushes do not waste runner capacity.

#### Scenario: Superseded pull request run is cancelled
- **WHEN** a pull request branch receives a new commit while an older run of the same workflow is still running
- **THEN** the newer workflow run uses the same concurrency group for that pull request or branch
- **AND** the older in-progress run is cancelled

### Requirement: Workflow files use area names
Repository GitHub Actions workflow files SHALL use short area names while their display names describe the workflow purpose.

#### Scenario: Area workflow names are inspectable
- **WHEN** GitHub Actions workflow files are inspected
- **THEN** root validation behavior is defined in `.github/workflows/ci.yml`
- **AND** CLI distribution behavior is defined in `.github/workflows/cli.yml`
- **AND** backend behavior is defined in `.github/workflows/backend.yml`
- **AND** Agent release behavior is defined in `.github/workflows/agent-release.yml`
- **AND** workflow display names remain descriptive enough to identify the purpose in GitHub checks

### Requirement: Web package behavior is covered beyond utility smoke tests
The web package SHALL include runtime tests for app-owned utilities and project shell behavior.

#### Scenario: Web shell behavior is tested
- **WHEN** web runtime tests execute
- **THEN** they verify user-observable project shell behavior or rendering contracts
- **AND** they include meaningful assertions beyond module import success

#### Scenario: Web utilities cover edge cases
- **WHEN** web utility tests execute
- **THEN** they cover normal, empty, and conflicting input cases
- **AND** expected output normalization is asserted

### Requirement: Docs content validity is covered
The docs package SHALL include tests for content metadata and route discoverability.

#### Scenario: Docs content has required metadata
- **WHEN** docs content tests inspect pages
- **THEN** every docs page has required title and description metadata
- **AND** generated coverage or build artifacts are excluded from content validation

#### Scenario: Docs links and routes are validated
- **WHEN** docs content references internal routes or links
- **THEN** tests verify those references are discoverable or explicitly allowed
- **AND** failures identify the affected content file

### Requirement: Web and docs coverage gate decisions are explicit
Web and docs SHALL remain visibility-only unless this change records baselines and explicitly promotes one or both packages to threshold-gated coverage.

#### Scenario: Baselines drive gating decisions
- **WHEN** package coverage is expanded
- **THEN** the coverage policy records web and docs baselines
- **AND** any threshold gates are package-local and conservative
