---
title: GitOps Reference
description: CthuOps-owned deployment resources, ArgoCD Applications, and backend image delivery.
---

Use this page as a path and resource lookup for the homelab deployment model. CthuTool is the image-producing source repository; the separate **CthuOps** repository owns cluster desired state.

## Deployment Entry Point

```text
https://github.com/mickmetalholic/CthuOps
```

## CthuOps Directory Structure

| Path | Purpose |
| --- | --- |
| `apps/cthutool/` | Backend `Deployment`, `Service`, `Ingress`, and Kustomize root |
| `apps/cthutool/kustomization.yaml` | Pins the GHCR backend image by digest |
| `argocd/applications/cthutool.yaml` | Argo CD Application reconciling the Backend |
| `docs/cthutool-release.md` | Image promotion workflow and digest-pin instructions |
| `bootstrap/` | Argo CD bootstrap and root Application notes |

## CthuTool GitOps Resources

CthuTool no longer contains Kubernetes or Argo CD manifests. Its only GitOps-related file is `gitops/README.md`, which records the ownership boundary and points operators at CthuOps.

## Backend Image Delivery

The `Backend Image` workflow in CthuTool builds and publishes the backend container when backend image inputs change on `main`.

Outputs:

- `ghcr.io/mickmetalholic/cthutool-backend:main`
- `ghcr.io/mickmetalholic/cthutool-backend:<commit-sha>`

The workflow does not update or commit Kubernetes deployment manifests. CthuOps pins a verified GHCR digest in `apps/cthutool/kustomization.yaml` and lets Argo CD reconcile the rollout.

## Observability

Cluster observability (metrics collection, dashboards, log storage, trace backend) is owned by the external deployment platform. CthuTool retains application-level diagnostics: structured stdout/stderr logs, `/metrics`, request context, and optional OTLP tracing when an external endpoint is configured.

## Requirement Sources

- `openspec/specs/apps-backend-image-ci/spec.md`
- `openspec/specs/apps-backend-observability/spec.md`
- `openspec/specs/apps-runtime-structured-logs/spec.md`
- `openspec/specs/apps-docs-site/spec.md`
