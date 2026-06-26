# apps-cli-distribution-ci Specification

## Purpose
TBD - created by archiving change refine-ci-required-workflows. Update Purpose after archive.
## Requirements
### Requirement: CLI distribution workflow is required-safe
The repository SHALL validate the committed CLI distribution bundle through a dedicated GitHub Actions workflow whose check can be marked required.

#### Scenario: Pull request exposes stable CLI distribution check
- **WHEN** a pull request is opened or updated
- **THEN** the CLI distribution workflow runs a job named `cli-dist`
- **AND** the job completes successfully without running the bundle check when CLI distribution inputs are unchanged
- **AND** the job runs the CLI distribution bundle check when CLI distribution inputs change

#### Scenario: Main branch exposes stable CLI distribution check
- **WHEN** a commit is pushed to `main`
- **THEN** the CLI distribution workflow runs a job named `cli-dist`
- **AND** the job uses affected-input detection before running dependency installation or bundle validation

### Requirement: CLI distribution affected inputs include bundle dependencies
The CLI distribution workflow SHALL treat CLI source, bundle scripts, package manager metadata, workspace metadata, lockfile, workflow configuration, and root TypeScript configuration as inputs that can affect the committed bundle.

#### Scenario: CLI bundle input changes run bundle validation
- **WHEN** a pull request changes `apps/cli/**`, CLI bundle scripts, root package metadata, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, the CLI workflow file, or `tsconfig.json`
- **THEN** the `cli-dist` job runs `pnpm run check:cli-dist`

#### Scenario: Unrelated input changes skip bundle validation
- **WHEN** a pull request changes files that cannot affect the CLI bundle
- **THEN** the `cli-dist` job reports a successful skip
- **AND** it does not install dependencies only for the bundle check

### Requirement: CLI workflow uses area filename and explicit display name
The CLI distribution workflow SHALL be stored in an area-named workflow file while presenting a descriptive workflow name in GitHub.

#### Scenario: CLI workflow file is area named
- **WHEN** repository workflow files are inspected
- **THEN** CLI distribution behavior is defined in `.github/workflows/cli.yml`
- **AND** the workflow display name identifies CLI distribution behavior
- **AND** `.github/workflows/ci.yml` does not define the `cli-dist` job

