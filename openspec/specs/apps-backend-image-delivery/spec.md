# apps-backend-image-delivery Specification

## Purpose
TBD - created by archiving change add-homelab-gitops. Update Purpose after archive.
## Requirements
### Requirement: Backend image is published to GHCR

The repository SHALL build and publish the CthuTool backend container image to GitHub Container Registry when backend image inputs change on `main`.

#### Scenario: Backend image workflow publishes main and commit tags

- **WHEN** changes are pushed to `main` that affect the backend Dockerfile, backend source, backend workspace dependencies, or workflow definition
- **THEN** the backend image workflow builds `apps/backend/Dockerfile`
- **AND** pushes `ghcr.io/mickmetalholic/cthutool-backend:main`
- **AND** pushes `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`

#### Scenario: Workflow pins the deployment to the built image

- **WHEN** the backend image workflow successfully publishes the commit image
- **THEN** it updates `k8s/deployment.yaml` so the backend container image is `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`
- **AND** commits the manifest update back to `main`
- **AND** the commit message prevents a recursive workflow run

#### Scenario: Deployment consumes the GHCR image

- **WHEN** the CthuTool backend Deployment manifest is inspected after the image workflow has run
- **THEN** its container image is pinned to `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`
- **AND** ArgoCD observes the manifest change and rolls out the Deployment
