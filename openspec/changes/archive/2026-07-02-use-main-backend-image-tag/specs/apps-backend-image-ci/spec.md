## MODIFIED Requirements

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

### Requirement: Backend image is published to GHCR
The repository SHALL build and publish the CthuTool backend container image to GitHub Container Registry when backend image inputs change on `main`.

#### Scenario: Backend image workflow publishes main and commit tags
- **WHEN** changes are pushed to `main` that affect the backend Dockerfile, backend source, backend workspace dependencies, or workflow definition
- **THEN** the backend image workflow builds `apps/backend/Dockerfile`
- **AND** pushes `ghcr.io/mickmetalholic/cthutool-backend:main`
- **AND** pushes `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`
- **AND** does not commit deployment manifest changes back to `main`

#### Scenario: Deployment consumes the GHCR main image
- **WHEN** the CthuTool backend Deployment manifest is inspected
- **THEN** its container image is `ghcr.io/mickmetalholic/cthutool-backend:main`
- **AND** its image pull policy ensures restarted Pods pull the current image for that tag

## REMOVED Requirements

### Requirement: Backend deployment manifest updates are concurrency safe
**Reason**: The backend image workflow will no longer update or commit `k8s/deployment.yaml`, so there are no workflow-managed deployment manifest writes to serialize.

**Migration**: Keep the backend image publishing concurrency group for image publication. Use Argo CD Image Updater digest tracking or another rollout mechanism to deploy new `:main` image digests without workflow commits to `main`.
