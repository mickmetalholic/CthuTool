## 1. Sync Current Deployment Sources

- [x] 1.1 Merge or sync latest `main` so GitOps manifests, backend image workflow, Kubernetes manifests, and related specs are available in the branch.
- [x] 1.2 Review `gitops/`, `k8s/`, `.github/workflows/backend-image.yml`, and relevant OpenSpec specs before editing docs.

## 2. Deployment Journey

- [x] 2.1 Rewrite Quick Start so the server-side path starts with Kubernetes/k3s and ArgoCD GitOps setup.
- [x] 2.2 Rewrite Homelab Deployment overview around Kubernetes resources, GHCR backend images, and ArgoCD-managed GitOps.
- [x] 2.3 Replace or rename local-checkout setup pages so local backend `pnpm` startup is not presented as homelab deployment.
- [x] 2.4 Update deployment configuration docs to describe ConfigMap, Deployment, Service, image pins, and environment variables from Kubernetes manifests.

## 3. Operations and Architecture

- [x] 3.1 Add operations guidance for ArgoCD sync, retry, self-heal, drift correction, rollout checks, and backend health probes.
- [x] 3.2 Update architecture docs with the GitHub Actions to GHCR to `k8s/deployment.yaml` to ArgoCD rollout flow.
- [x] 3.3 Add or update reference docs for GitOps directory structure, namespace resources, Application CRs, and backend image delivery.

## 4. Development Boundary

- [x] 4.1 Move local backend startup commands to development/reference docs or package README pointers only.
- [x] 4.2 Update source-boundary docs to distinguish official homelab deployment from local package development.
- [x] 4.3 Preserve package-local README development commands without duplicating user deployment prose.

## 5. Capability Index and Validation

- [x] 5.1 Update the OpenSpec capability index after GitOps/backend-image specs are present.
- [x] 5.2 Run `pnpm --filter @cthutool/docs validate`.
- [x] 5.3 Run `openspec validate apps-docs-kubernetes-deployment-docs --strict`.
