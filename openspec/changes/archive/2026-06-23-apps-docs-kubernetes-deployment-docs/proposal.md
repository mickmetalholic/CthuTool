## Why

The docs site currently treats local checkout commands and homelab deployment as the same reader journey, which conflicts with the repository's new Kubernetes/GitOps deployment model. Homelab users should see Kubernetes, GHCR, and ArgoCD as the official deployment path, while local `pnpm` commands should be clearly scoped to development and debugging.

## What Changes

- Reframe user-facing Homelab Deployment docs around Kubernetes manifests, GitOps directories, GHCR backend images, and ArgoCD reconciliation.
- Move local backend `pnpm` startup content out of the deployment journey and into development/reference material.
- Update Quick Start to begin with k3s/ArgoCD GitOps setup instead of local dependency installation and backend dev server startup.
- Add or update operations docs for image publication, manifest pinning, ArgoCD sync, rollout checks, drift correction, and Kubernetes troubleshooting.
- Update architecture/reference docs to describe the GitHub Actions -> GHCR -> `k8s/` manifest -> ArgoCD rollout flow.
- Ensure docs link to GitOps and backend image OpenSpec specs once the latest `main` specs are merged into the branch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-docs-site`: Clarify that the official homelab deployment documentation is Kubernetes/GitOps-first and that local runtime commands are development references, not the primary deployment path.

## Impact

- Affects documentation content and navigation under `apps/docs/src/content/docs/`.
- May update README and package README pointers to distinguish deployment docs from local development commands.
- May update the OpenSpec capability index if the branch receives new GitOps/backend-image specs from `main`.
- No backend, CLI, desktop, web, Kubernetes, or GitOps runtime behavior changes are expected.
