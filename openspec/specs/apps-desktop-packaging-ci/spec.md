# apps-desktop-packaging-ci Specification

## Purpose
Define desktop icon assets, packaging configuration, artifact workflows, dependency-aware validation, and desktop workflow naming.

## Requirements
### Requirement: Desktop icon assets
The repository SHALL provide CthuDesktop icon assets suitable for renderer display and desktop packaging.

#### Scenario: Renderer icon is available
- **WHEN** the CthuDesktop shell renders app identity
- **THEN** it can load a repository-owned icon asset for the title bar or app identity area

#### Scenario: Windows package icon is available
- **WHEN** the Windows desktop package is built
- **THEN** electron-builder uses a Windows-compatible icon asset for the generated artifact

#### Scenario: macOS package icon is available
- **WHEN** the macOS desktop package is built
- **THEN** electron-builder uses a macOS-compatible icon asset for the generated artifact

### Requirement: Desktop packaging configuration
The desktop package SHALL define macOS and Windows packaging targets that can run in CI without production signing secrets.

#### Scenario: Windows packaging target is configured
- **WHEN** a developer inspects the desktop package build configuration
- **THEN** it includes a Windows packaging target suitable for CI artifact generation

#### Scenario: macOS packaging target is configured
- **WHEN** a developer inspects the desktop package build configuration
- **THEN** it includes a macOS packaging target suitable for CI artifact generation

#### Scenario: Signing is not required for CI artifact build
- **WHEN** CI builds desktop artifacts for this change
- **THEN** the build does not require production code signing, notarization, or certificate secrets

### Requirement: GitHub Actions desktop artifact workflow
The repository SHALL include a GitHub Actions workflow that builds and uploads CthuDesktop artifacts for Windows and macOS.

#### Scenario: Workflow runs desktop validation
- **WHEN** the desktop artifact workflow runs
- **THEN** it installs workspace dependencies and runs desktop-focused typecheck, tests, and build steps before packaging

#### Scenario: Workflow packages Windows and macOS artifacts
- **WHEN** the desktop artifact workflow runs
- **THEN** it builds desktop artifacts on `windows-latest` and `macos-latest`

#### Scenario: Workflow uploads artifacts
- **WHEN** desktop packaging succeeds in CI
- **THEN** the workflow uploads the generated platform artifacts with names that identify CthuDesktop and the target platform

#### Scenario: Existing repository CI remains focused
- **WHEN** normal repository CI runs
- **THEN** desktop artifact packaging can remain in a dedicated workflow rather than adding heavy packaging work to the existing coverage job

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

### Requirement: Desktop validation uses Turbo filtered dependency graph
The desktop artifact workflow SHALL validate the desktop package through the Turborepo dependency graph before running platform-specific packaging commands.

#### Scenario: Desktop graph validation runs before packaging
- **WHEN** the desktop artifact workflow runs
- **THEN** it installs dependencies with the frozen lockfile
- **AND** it restores Turbo task cache before Turbo validation tasks
- **AND** it runs typecheck, test, and build validation for `@cthutool/desktop` and its workspace dependency graph
- **AND** platform-specific packaging runs only after graph validation succeeds

#### Scenario: Platform packaging avoids redundant rebuilds
- **WHEN** desktop graph build validation has already produced the package build output
- **THEN** Windows and macOS packaging commands reuse the existing build output where package scripts support it
- **AND** the workflow does not intentionally rebuild the same desktop output more than once per platform job

### Requirement: Desktop workflow uses area filename and explicit display name
The desktop artifact workflow SHALL be stored in an area-named workflow file while presenting a descriptive workflow name in GitHub.

#### Scenario: Desktop workflow file is area named
- **WHEN** repository workflow files are inspected
- **THEN** desktop artifact behavior is defined in `.github/workflows/desktop.yml`
- **AND** the workflow display name identifies desktop artifact behavior
- **AND** the old `.github/workflows/desktop-artifacts.yml` file is not retained as a duplicate workflow
