## MODIFIED Requirements

### Requirement: Desktop artifact workflow tracks desktop dependency changes
The desktop artifact workflow SHALL expose stable platform packaging checks and SHALL run packaging work only when changes affect the desktop package or root-managed packages that contribute to the desktop build.

#### Scenario: Desktop dependency package changes trigger artifacts workflow
- **WHEN** a pull request changes `apps/desktop/**`, `packages/agent-protocol/**`, `packages/app-shell/**`, `packages/ui/**`, or recursive workspace dependencies of `@cthutool/desktop`
- **THEN** the desktop artifact workflow runs platform packaging jobs
- **AND** the workflow validates desktop packaging before the pull request is considered artifact-ready

#### Scenario: Shared workspace configuration changes trigger artifacts workflow
- **WHEN** a pull request changes root package manifests, workspace configuration, lockfile, TypeScript configuration, Turbo configuration, or the desktop artifact workflow itself
- **THEN** the desktop artifact workflow runs platform packaging jobs

#### Scenario: Unrelated changes skip desktop artifacts successfully
- **WHEN** a pull request changes files that cannot affect desktop artifacts
- **THEN** the desktop artifact workflow still exposes the macOS and Windows platform check names
- **AND** each platform job completes successfully without installing dependencies, running Turbo graph validation, packaging artifacts, or uploading artifacts
- **AND** each platform job output states that desktop artifact inputs are unchanged

## ADDED Requirements

### Requirement: Desktop workflow uses area filename and explicit display name
The desktop artifact workflow SHALL be stored in an area-named workflow file while presenting a descriptive workflow name in GitHub.

#### Scenario: Desktop workflow file is area named
- **WHEN** repository workflow files are inspected
- **THEN** desktop artifact behavior is defined in `.github/workflows/desktop.yml`
- **AND** the workflow display name identifies desktop artifact behavior
- **AND** the old `.github/workflows/desktop-artifacts.yml` file is not retained as a duplicate workflow
