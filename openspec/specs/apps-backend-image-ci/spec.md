# apps-backend-image-ci Specification

## Purpose
Define backend container image CI validation, affected-input handling, image publishing, pinned tool versions, and workflow naming.

## Requirements
### Requirement: Backend image CI validates pull request Docker builds
The backend image workflow SHALL expose a stable pull request validation job and SHALL build backend Docker images only when affected inputs change.

#### Scenario: Pull request builds backend image without push
- **WHEN** a pull request changes backend source, backend image workflow configuration, backend Dockerfile inputs, backend workspace dependencies, root package manifests, workspace configuration, lockfile, TypeScript configuration, or Kubernetes deployment manifests
- **THEN** the backend image workflow builds the backend image
- **AND** it does not log in to the container registry
- **AND** it does not push image tags
- **AND** it does not update `k8s/deployment.yaml`

#### Scenario: Pull request skips unaffected backend image validation successfully
- **WHEN** a pull request changes files that cannot affect the backend image
- **THEN** the backend image workflow still exposes the pull request validation job
- **AND** the job completes successfully without setting up Docker Buildx or building the image
- **AND** the job output states that backend image inputs are unchanged

### Requirement: Backend image CI publishes images on main
The backend image workflow SHALL publish backend container images for qualifying pushes to `main` and SHALL skip publishing successfully when backend image inputs are unchanged.

#### Scenario: Main branch push publishes backend image tags
- **WHEN** a qualifying push to `main` changes backend image inputs
- **THEN** the workflow logs in to GitHub Container Registry
- **AND** it builds the backend image
- **AND** it pushes both the `main` tag and the triggering commit SHA tag
- **AND** it uses Docker layer caching to speed repeated builds
- **AND** it does not update `k8s/deployment.yaml`
- **AND** it does not create or push a follow-up deployment manifest commit

#### Scenario: Main branch push skips unaffected backend image publish
- **WHEN** a push to `main` does not change backend image inputs
- **THEN** the backend image publish job completes successfully
- **AND** it does not log in to the container registry
- **AND** it does not push image tags
- **AND** it does not update `k8s/deployment.yaml`

### Requirement: Backend image build uses pinned workspace tool versions
Backend Docker builds SHALL use the repository-pinned package manager version.

#### Scenario: Dockerfile pins pnpm version
- **WHEN** the backend Dockerfile prepares pnpm with Corepack
- **THEN** it uses the exact pnpm version declared by the repository package manager configuration
- **AND** Docker image dependency installation remains compatible with the frozen pnpm lockfile

### Requirement: Backend workflow uses area filename and explicit display name
The backend image workflow SHALL be stored in an area-named workflow file while presenting a descriptive workflow name in GitHub.

#### Scenario: Backend workflow file is area named
- **WHEN** repository workflow files are inspected
- **THEN** backend image behavior is defined in `.github/workflows/backend.yml`
- **AND** the workflow display name identifies backend image behavior
- **AND** the old `.github/workflows/backend-image.yml` file is not retained as a duplicate workflow

### Requirement: Backend image is published to GHCR
The repository SHALL build and publish the CthuTool backend container image to GitHub Container Registry when backend image inputs change on `main`.

#### Scenario: Backend image workflow publishes main and commit tags
- **WHEN** changes are pushed to `main` that affect the backend Dockerfile, backend source, backend workspace dependencies, or workflow definition
- **THEN** the backend image workflow builds `apps/backend/Dockerfile`
- **AND** pushes `ghcr.io/mickmetalholic/cthutool-backend:main`
- **AND** pushes `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`
- **AND** does not commit deployment manifest changes back to `main`

#### Scenario: Deployment consumes the GHCR image
- **WHEN** the CthuTool backend Deployment manifest is inspected
- **THEN** its container image is `ghcr.io/mickmetalholic/cthutool-backend:main`
- **AND** its image pull policy ensures restarted Pods pull the current image for that tag
