---
title: Configuration
description: Kubernetes configuration sources for the homelab backend deployment.
---

CthuTool homelab configuration is defined in Kubernetes manifests and reconciled by ArgoCD. Edit manifests in git, not live cluster resources, so ArgoCD can preserve the desired state.

| Kubernetes source | Purpose |
| --- | --- |
| `k8s/configmap.yaml` | Backend environment values |
| `k8s/deployment.yaml` | Backend container image, probes, resources, and env wiring |
| `k8s/service.yaml` | In-cluster backend Service on port `3000` |
| `gitops/namespaces/cthutool.yaml` | Target namespace |
| `gitops/apps/cthutool/application.yaml` | ArgoCD source, destination, sync, retry, and self-heal policy |

## Backend ConfigMap

`k8s/configmap.yaml` creates `ConfigMap/cthutool-backend` in namespace `cthutool`.

Current values:

```yaml
NODE_ENV: "production"
PORT: "3000"
LOG_LEVEL: "info"
OTEL_SERVICE_NAME: "cthutool-backend"
OTEL_EXPORTER_OTLP_ENDPOINT: "http://otel-collector.observability.svc.cluster.local:4318"
OTEL_TRACES_EXPORTER: "otlp"
OTEL_METRICS_EXPORTER: "none"
OTEL_LOGS_EXPORTER: "none"
OTEL_PROPAGATORS: "tracecontext,baggage"
```

The Deployment consumes these values with `envFrom.configMapRef.name: cthutool-backend`.

## Backend Deployment

`k8s/deployment.yaml` runs `Deployment/cthutool-backend` with one replica. The container image uses the GHCR `main` tag:

```text
ghcr.io/mickmetalholic/cthutool-backend:main
```

Do not manually change the live Deployment image with `kubectl set image`; ArgoCD will revert drift. The supported rollout path is to let `.github/workflows/backend.yml` build and push GHCR tags, then use Argo CD Image Updater digest tracking or an equivalent rollout trigger to restart Pods for the current `:main` digest.

The Deployment also defines:

- container port `3000`
- `imagePullPolicy: Always`
- CPU request `100m` and limit `500m`
- memory request `256Mi` and limit `512Mi`
- liveness probe `GET /health`
- readiness probe `GET /health/ready`

## Backend Service

`k8s/service.yaml` creates `Service/cthutool-backend` as `ClusterIP` on port `3000`, targeting the backend container port `3000`.

The Service is annotated for Prometheus scraping:

```yaml
prometheus.io/scrape: "true"
prometheus.io/path: /metrics
prometheus.io/port: "3000"
prometheus.io/scheme: http
```

Prometheus uses `/metrics` for scraping. Kubernetes probes use `/health` and `/health/ready`.

Use your cluster's existing ingress, reverse proxy, load balancer, or port-forward workflow to expose the backend to client computers. The repository does not currently define an ingress or TLS manifest.

## Browser Site Policy

Backend browser site policy is still owned by backend configuration. If `BROWSER_SITES_CONFIG_FILE` is introduced into the cluster deployment, mount it through Kubernetes-managed configuration rather than baking private runtime files into the image.

The file stores site policy only. Do not store cookies, localStorage, Playwright storage-state bundles, browser user data directories, or desktop profile paths in it.

See [Browser Auth](/modules/browser-auth/) for the ownership model.
