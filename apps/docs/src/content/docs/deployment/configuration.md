---
title: Configuration
description: CthuOps-managed Kubernetes configuration sources for the homelab backend deployment.
---

CthuTool homelab configuration is defined in Kubernetes manifests owned by the separate **CthuOps** repository and reconciled by Argo CD. Edit manifests in the CthuOps checkout, not live cluster resources, so Argo CD can preserve the desired state.

| Kubernetes source (in CthuOps) | Purpose |
| --- | --- |
| `apps/cthutool/kustomization.yaml` | Backend image digest, environment values, and Kustomize root |
| `apps/cthutool/deployment.yaml` | Backend container image, probes, resources, and env wiring |
| `apps/cthutool/service.yaml` | In-cluster backend Service on port `3000` |
| `apps/cthutool/ingress.yaml` | Ingress and TLS |
| `argocd/applications/cthutool.yaml` | Argo CD source, destination, sync, retry, and self-heal policy |

## Backend ConfigMap

CthuOps generates `ConfigMap/cthutool-backend` in namespace `cthutool` through its Kustomize `configMapGenerator`.

Current values:

```yaml
NODE_ENV: "production"
PORT: "3000"
LOG_LEVEL: "info"
OTEL_SDK_DISABLED: "true"
CTHUTOOL_ENVIRONMENT_ID: "production"
CTHUTOOL_OPERATOR_ACCESS_MODE: "trusted-proxy"
```

The Deployment consumes these values with `envFrom.configMapRef.name: cthutool-backend`.
The Deployment reads `CTHUTOOL_AGENT_SECRET` and
`CTHUTOOL_TRUSTED_PROXY_IPS` from the out-of-band
`Secret/cthutool-backend-secrets`. The latter must contain the actual source IP
or IPs of the ingress proxy; do not commit secret material or an unresolved
proxy placeholder.

## Backend Deployment

CthuOps runs `Deployment/cthutool-backend` with one replica. The container image is pinned by OCI digest in `apps/cthutool/kustomization.yaml`:

```text
ghcr.io/mickmetalholic/cthutool-backend@sha256:...
```

Do not manually change the live Deployment image with `kubectl set image`; Argo CD will revert drift. The supported rollout path is to let `.github/workflows/backend.yml` build and push GHCR tags, then pin the verified digest in CthuOps and let Argo CD reconcile.

The Deployment also defines:

- container port `3000`
- CPU request `100m` and limit `500m`
- memory request `256Mi` and limit `512Mi`
- liveness probe `GET /health`
- readiness probe `GET /health/ready`

## Backend Service

CthuOps exposes `Service/cthutool-backend` as `ClusterIP` on port `3000`, targeting the backend container port `3000`. Any Prometheus scrape configuration for the external metrics platform is owned by the deployment environment.

Use your cluster's existing ingress, reverse proxy, load balancer, or port-forward workflow to expose the backend to client computers. Ingress and TLS manifests are owned by CthuOps.

## Browser Site Policy

Backend browser site policy is still owned by backend configuration. If `BROWSER_SITES_CONFIG_FILE` is introduced into the cluster deployment, mount it through CthuOps-managed configuration rather than baking private runtime files into the image.

The file stores site policy only. Do not store cookies, localStorage, Playwright storage-state bundles, browser user data directories, or local profile paths in it.

See [Browser Auth](/modules/browser-auth/) for the ownership model.
