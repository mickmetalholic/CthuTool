## Context

The docs restructure made `apps/docs/src/content/docs/` the primary user and operator documentation source, but the current deployment journey still includes checkout-based local backend startup as a homelab path. New work on `main` introduces Kubernetes manifests, GitOps directories, backend image delivery through GHCR, and ArgoCD Application resources. The docs should reflect that Kubernetes/GitOps is the official homelab deployment path.

The branch may need to merge the latest `main` before implementation so the docs can link to the new GitOps and backend image specs and source files.

## Goals / Non-Goals

**Goals:**

- Make Kubernetes/GitOps the only official user-facing homelab deployment path.
- Keep local `pnpm` backend startup commands available only as development or debugging references.
- Explain the deployment flow from GitHub Actions image build to GHCR, committed `k8s/` image pin, and ArgoCD rollout.
- Document GitOps operations such as namespace/Application application, auto-sync, retry, drift correction, health checks, and rollback/troubleshooting entry points.
- Update OpenSpec capability browsing to include GitOps/backend-image specs after merging current `main`.

**Non-Goals:**

- Change Kubernetes manifests, ArgoCD resources, backend Dockerfile, or GitHub Actions workflows.
- Remove package-local development commands from package README files.
- Document every possible Kubernetes distribution or ingress/TLS strategy in this change.
- Add app-of-apps bootstrap automation; current GitOps bootstrap remains manual unless changed elsewhere.

## Decisions

### Deployment docs become Kubernetes/GitOps-first

The `deployment/` section will describe homelab deployment through k3s or another Kubernetes cluster, ArgoCD, `gitops/`, `k8s/`, and GHCR-hosted backend images. Pages that currently present `pnpm --filter @cthutool/backend run start:dev` as a deployment path will be rewritten to use Kubernetes resources as the main path.

Local checkout commands remain valid for developers, but they will move to package README files or reference pages. This avoids teaching users two competing deployment models.

### GitOps content belongs in user operations and architecture

The docs site should expose GitOps in three places:

- Deployment: setup and apply flow for namespaces and Application CRs.
- Operations: ArgoCD sync, retry, rollout, health checks, and drift correction.
- Architecture/reference: GitHub Actions -> GHCR -> `k8s/deployment.yaml` image pin -> ArgoCD sync.

This keeps the deployment guide task-oriented while still preserving implementation context.

### Spec links stay authoritative

Docs pages will summarize GitOps and image-delivery behavior and link to OpenSpec sources for requirements. The relevant specs are expected to be:

- `openspec/specs/apps-backend-image-delivery/spec.md`
- `openspec/specs/gitops-argo-applications/spec.md`
- `openspec/specs/gitops-bootstrap/spec.md`
- `openspec/specs/gitops-cluster-namespaces/spec.md`
- `openspec/specs/apps-docs-site/spec.md`

If those specs are not present until `main` is merged, implementation should merge or otherwise sync `main` first.

## Risks / Trade-offs

- [Risk] Users may still need local commands for troubleshooting -> Keep local run commands in development/reference pages and package README files, clearly labeled as non-deployment.
- [Risk] GitOps docs can drift from manifests -> Link to `gitops/`, `k8s/`, and OpenSpec paths and keep procedural docs focused on stable flow.
- [Risk] Ingress/TLS is not yet documented -> Mark it as out of scope or a future operations topic instead of inventing unsupported steps.
- [Risk] Branch lacks latest GitOps specs -> Merge latest `main` before implementation and let OpenSpec index validation catch omissions.

## Migration Plan

1. Merge or otherwise sync latest `main` so GitOps/backend image specs and manifests are present.
2. Rewrite Quick Start and Deployment pages around Kubernetes/GitOps.
3. Move local backend startup commands to reference/development contexts only.
4. Add operations and architecture/reference pages or sections for GHCR image delivery, ArgoCD sync, and Kubernetes health checks.
5. Update OpenSpec capability index for GitOps/backend-image specs.
6. Run docs validation and OpenSpec validation.

## Open Questions

- Should ingress/TLS receive its own future deployment page once a supported ingress strategy exists?
- Should `gitops/bootstrap/` eventually become an app-of-apps root Application flow?
