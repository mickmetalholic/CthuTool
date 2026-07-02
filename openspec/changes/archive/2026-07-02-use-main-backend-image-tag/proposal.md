## Why

The backend image workflow currently commits `k8s/deployment.yaml` back to `main` after every qualifying image publish, but repository rules reject direct pushes to `main`. This leaves the workflow red even when the backend image build and push succeed.

## What Changes

- Change the backend Deployment manifest to reference the mutable `ghcr.io/mickmetalholic/cthutool-backend:main` image tag with `imagePullPolicy: Always`.
- Keep publishing both `:main` and `:<commit-sha>` image tags from the backend image workflow.
- Remove workflow steps that rewrite `k8s/deployment.yaml`, create a deployment manifest commit, and push directly to `main`.
- Document that automatic redeployment for the mutable `:main` tag depends on an external rollout trigger such as Argo CD Image Updater using digest tracking, or a cluster-level rollout mechanism.
- Preserve pull request image validation behavior and unaffected-change skip behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-backend-image-ci`: backend image publishing no longer pins and commits `k8s/deployment.yaml`; it publishes reusable tags and avoids direct `main` pushes.
- `gitops-delivery`: CthuTool GitOps delivery consumes the backend `:main` image tag and relies on an explicit image-update/rollout mechanism for redeployment.

## Impact

- `.github/workflows/backend.yml`: remove deployment manifest rewrite and commit/push steps; reduce required permissions to avoid unnecessary repository writes.
- `k8s/deployment.yaml`: change backend image reference from a commit SHA tag to `:main`.
- OpenSpec specs and docs/tests covering backend image CI and GitOps delivery.
- Operational follow-up: configure Argo CD Image Updater digest strategy or another rollout trigger so mutable tag updates result in new Pods.
