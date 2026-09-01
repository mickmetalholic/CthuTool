## MODIFIED Requirements

### Requirement: Backend image CI validates pull request Docker builds
The backend image workflow SHALL expose a stable pull request validation job and SHALL build backend Docker images only when affected source, workflow, Dockerfile, or workspace inputs change. CthuTool deployment manifests are not image inputs because deployment is owned by CthuOps.

#### Scenario: Pull request builds backend image without push
- **WHEN** a pull request changes backend source, backend image workflow configuration, backend Dockerfile inputs, backend workspace dependencies, root package manifests, workspace configuration, lockfile, or TypeScript configuration
- **THEN** the backend image workflow builds the backend image
- **AND** it does not log in to the container registry
- **AND** it does not push image tags
- **AND** it does not validate or update a CthuTool Kubernetes deployment manifest

#### Scenario: Pull request skips unaffected backend image validation successfully
- **WHEN** a pull request changes files that cannot affect the backend image
- **THEN** the backend image workflow still exposes the pull request validation job
- **AND** the job completes successfully without setting up Docker Buildx or building the image
- **AND** the job output states that backend image inputs are unchanged

### Requirement: Backend image CI publishes images on main
The backend image workflow SHALL publish backend container images for qualifying pushes to `main` and SHALL skip publishing successfully when backend image inputs are unchanged. Deployment promotion and rollout SHALL remain external to CthuTool.

#### Scenario: Main branch push publishes backend image tags
- **WHEN** a qualifying push to `main` changes backend image inputs
- **THEN** the workflow logs in to GitHub Container Registry
- **AND** it builds the backend image
- **AND** it pushes both the `main` tag and the triggering commit SHA tag
- **AND** it uses Docker layer caching to speed repeated builds
- **AND** it does not update or commit Kubernetes deployment manifests

#### Scenario: Main branch push skips unaffected backend image publish
- **WHEN** a push to `main` does not change backend image inputs
- **THEN** the backend image publish job completes successfully
- **AND** it does not log in to the container registry
- **AND** it does not push image tags
- **AND** it does not update or commit Kubernetes deployment manifests

### Requirement: Backend image is published to GHCR
The repository SHALL build and publish the CthuTool backend container image to GitHub Container Registry when backend image inputs change on `main`, while an external operations repository consumes the published image.

#### Scenario: Backend image workflow publishes main and commit tags
- **WHEN** changes are pushed to `main` that affect the backend Dockerfile, backend source, backend workspace dependencies, or workflow definition
- **THEN** the backend image workflow builds `apps/backend/Dockerfile`
- **AND** pushes `ghcr.io/mickmetalholic/cthutool-backend:main`
- **AND** pushes `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`
- **AND** does not commit deployment manifest changes back to `main`

#### Scenario: Deployment consumption is externalized
- **WHEN** the CthuTool repository's deployment ownership is inspected
- **THEN** CthuTool contains no authoritative Kubernetes Deployment manifest for the Backend
- **AND** the repository identifies CthuOps as the owner of image digest promotion and cluster rollout
