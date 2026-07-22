## MODIFIED Requirements

### Requirement: Type-only contracts run through typecheck
Type-only public API and import contract checks SHALL run through `typecheck` rather than through package `test` scripts.

#### Scenario: Test scripts are not typecheck-only
- **WHEN** root engineering contract tests inspect package `test` scripts
- **THEN** no package `test` script is satisfied only by `tsc --noEmit`

### Requirement: Workflow files use area names
Repository GitHub Actions workflow files SHALL use short area names while their display names describe the workflow purpose.

#### Scenario: Area workflow names are inspectable
- **WHEN** GitHub Actions workflow files are inspected
- **THEN** root validation behavior is defined in `.github/workflows/ci.yml`
- **AND** CLI distribution behavior is defined in `.github/workflows/cli.yml`
- **AND** backend behavior is defined in `.github/workflows/backend.yml`
- **AND** Agent release behavior is defined in `.github/workflows/agent-release.yml`
- **AND** workflow display names remain descriptive enough to identify the purpose in GitHub checks

## REMOVED Requirements

### Requirement: App shell runtime behavior is covered
**Reason**: The app-shell package has no consumer after the Electron renderer is removed.
**Migration**: Keep deployed-Web behavior tests in `apps/web` and local machine behavior tests in the Agent bridge/runtime packages.

### Requirement: Shared UI component behavior is covered
**Reason**: The shared UI package has no remaining workspace consumer.
**Migration**: Own Web component behavior and accessibility tests inside the independently deployed Web application.

### Requirement: Shared frontend package coverage is evaluated per package
**Reason**: The retired app-shell and UI packages no longer produce coverage artifacts or gates.
**Migration**: Continue package-local coverage policy for live frontend and client packages only.

### Requirement: Desktop runtime coverage covers persistence and browser orchestration
**Reason**: The Electron runtime and its tests are removed after browser hosting moves to the local Agent.
**Migration**: Use Agent runtime, data migration, browser protocol, and supported-platform smoke tests.

### Requirement: Desktop renderer coverage includes user workflows
**Reason**: There is no local renderer after cutover.
**Migration**: Test management workflows in `apps/web` and local operations through the Agent bridge.

### Requirement: Desktop coverage baseline is reviewed before gating
**Reason**: The retired Desktop package no longer has a coverage baseline or gate.
**Migration**: Keep coverage decisions explicit for active workspace packages.
