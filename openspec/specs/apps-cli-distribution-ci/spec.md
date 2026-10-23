# apps-cli-distribution-ci Specification

## Purpose
Define CLI distribution CI behavior for required-safe bundle validation, affected inputs, and workflow naming.

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
The CLI distribution workflow SHALL treat CLI source, bundle scripts, package manager metadata, workspace metadata, lockfile, workflow configuration, root TypeScript configuration, dotfiles runtime assets, chezmoi source declarations, and machine bootstrap scripts and lock metadata as distribution inputs. Changes to those inputs SHALL run the committed bundle check and applicable offline asset validation.

#### Scenario: CLI bundle input changes run bundle validation
- **WHEN** a pull request changes `apps/cli/**`, CLI bundle scripts, root package metadata, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, the CLI workflow file, or `tsconfig.json`
- **THEN** the `cli-dist` job runs `pnpm run check:cli-dist`

#### Scenario: Dotfiles or bootstrap assets change
- **WHEN** a pull request changes `dotfiles/**`, `.chezmoiroot`, `.chezmoiversion`, either machine bootstrap script, or its runtime lock metadata
- **THEN** the stable `cli-dist` job runs distribution consistency and applicable offline snapshot/asset checks
- **AND** these checks require neither Notion credentials nor host package installation

#### Scenario: Unrelated input changes skip bundle validation
- **WHEN** a pull request changes files that cannot affect the CLI distribution
- **THEN** the `cli-dist` job reports a successful skip
- **AND** it does not install dependencies only for the bundle check

### Requirement: CLI workflow uses area filename and explicit display name
The CLI distribution workflow SHALL be stored in an area-named workflow file while presenting a descriptive workflow name in GitHub.

#### Scenario: CLI workflow file is area named
- **WHEN** repository workflow files are inspected
- **THEN** CLI distribution behavior is defined in `.github/workflows/cli.yml`
- **AND** the workflow display name identifies CLI distribution behavior
- **AND** `.github/workflows/ci.yml` does not define the `cli-dist` job

### Requirement: Distributed dotfiles assets are complete and location independent
CLI distribution checks SHALL verify that the installable package includes the required published data, templates, and non-secret synchronization metadata. A committed-bundle smoke test SHALL resolve these assets outside the repository working directory under Node 24 without development dependencies, a Go binary, or Notion access.

#### Scenario: Installing and invoking from another directory
- **WHEN** the packaged committed CLI is installed and invoked from an unrelated working directory
- **THEN** dotfiles notion validate and host-neutral help can find the required assets
- **AND** no development-only path or tool is required

#### Scenario: A required template is omitted from the package
- **WHEN** a distribution change leaves a required data or template file outside the shipped asset inventory
- **THEN** distribution validation fails before publication
