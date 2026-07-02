## ADDED Requirements

### Requirement: CthuTool backend deployment tracks the main image tag
The CthuTool GitOps delivery manifests SHALL reference the backend `:main` image tag and SHALL rely on an explicit rollout trigger to deploy new image digests behind that tag.

#### Scenario: Deployment manifest references the main backend image
- **WHEN** the CthuTool backend Deployment manifest is inspected
- **THEN** the backend container image is `ghcr.io/mickmetalholic/cthutool-backend:main`
- **AND** the backend container image pull policy is `Always`

#### Scenario: Mutable tag deployment requires digest-aware rollout automation
- **WHEN** a new backend image is pushed to `ghcr.io/mickmetalholic/cthutool-backend:main`
- **THEN** the repository does not require a follow-up commit to `k8s/deployment.yaml`
- **AND** the deployment environment is expected to use Argo CD Image Updater digest strategy or an equivalent rollout trigger before Pods are automatically restarted for the new image digest
