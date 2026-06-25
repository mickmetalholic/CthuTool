# apps-backend-image-ci Specification

## Purpose
TBD - created by archiving change improve-ci-coverage-and-speed. Update Purpose after archive.
## Requirements
### Requirement: Backend image CI validates pull request Docker builds
The backend image workflow SHALL validate backend Docker image builds on pull requests that affect backend image inputs without publishing an image.

#### Scenario: Pull request builds backend image without push
- **WHEN** a pull request changes backend source, backend image workflow configuration, backend Dockerfile inputs, backend workspace dependencies, root package manifests, workspace configuration, lockfile, TypeScript configuration, or Kubernetes deployment manifests
- **THEN** the backend image workflow builds the backend image
- **AND** it does not log in to the container registry
- **AND** it does not push image tags
- **AND** it does not update `k8s/deployment.yaml`

### Requirement: Backend image CI publishes images on main
The backend image workflow SHALL publish backend container images for qualifying pushes to `main`.

#### Scenario: Main branch push publishes backend image tags
- **WHEN** a qualifying push to `main` triggers the backend image workflow
- **THEN** the workflow logs in to GitHub Container Registry
- **AND** it builds the backend image
- **AND** it pushes both the `main` tag and the triggering commit SHA tag
- **AND** it uses Docker layer caching to speed repeated builds

### Requirement: Backend deployment manifest updates are concurrency safe
The backend image workflow SHALL protect deployment manifest update runs from overlapping writes.

#### Scenario: Main branch image publishing is serialized
- **WHEN** multiple backend image publishing runs are queued for `main`
- **THEN** the workflow uses a stable concurrency group for backend image publishing
- **AND** deployment manifest update steps do not run concurrently against `k8s/deployment.yaml`

#### Scenario: Deployment manifest pins commit image
- **WHEN** the backend image publish succeeds for a main branch commit
- **THEN** the workflow updates `k8s/deployment.yaml` to reference the triggering commit SHA image tag
- **AND** the committed manifest update does not retrigger the full CI pipeline unnecessarily

### Requirement: Backend image build uses pinned workspace tool versions
Backend Docker builds SHALL use the repository-pinned package manager version.

#### Scenario: Dockerfile pins pnpm version
- **WHEN** the backend Dockerfile prepares pnpm with Corepack
- **THEN** it uses the exact pnpm version declared by the repository package manager configuration
- **AND** Docker image dependency installation remains compatible with the frozen pnpm lockfile

