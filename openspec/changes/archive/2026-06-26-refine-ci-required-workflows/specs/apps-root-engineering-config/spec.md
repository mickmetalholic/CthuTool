## MODIFIED Requirements

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

## ADDED Requirements

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
- **AND** desktop behavior is defined in `.github/workflows/desktop.yml`
- **AND** workflow display names remain descriptive enough to identify the purpose in GitHub checks
