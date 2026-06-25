# gitops/

Cluster-level GitOps configuration for the homelab k3s cluster. This directory is the single source of truth for all cluster workloads managed by ArgoCD.

## Directory Structure

```
gitops/
├── namespaces/          # Namespace resources (one per deployed application)
├── apps/                # ArgoCD Application CRs (one subdirectory per app)
│   └── <app-name>/
│       └── application.yaml
├── observability/       # Observability stack docs and extension points
├── bootstrap/           # ArgoCD self-install manifests (future)
└── README.md
```

## Conventions

- **Namespace per app**: Each deployed application gets its own namespace. Create a `<app>.yaml` file in `namespaces/`. Include at minimum `app.kubernetes.io/name` and `app.kubernetes.io/managed-by: argocd` labels.
- **Application CR**: Each deployed app gets a subdirectory under `apps/<app-name>/` containing an ArgoCD `Application` CR named `application.yaml`.
- **Auto-sync**: Applications are configured with automated sync (`prune: true`, `selfHeal: true`). ArgoCD polls git every **3 minutes** by default and reconciles any drift.
- **Retry**: A `syncPolicy.retry` block with exponential backoff (up to 3 minutes) handles transient failures — once the app repo's manifests are valid, the Application self-recovers without manual intervention.
- **Drift correction**: If a resource is manually edited on the cluster via `kubectl edit`, ArgoCD reverts it within minutes. Edit manifests in git, not the live cluster.
- **Observability**: Prometheus, Grafana, Loki, and Alloy are managed through upstream chart Applications. See `gitops/observability/README.md` for the metrics, logs, dashboard, and future telemetry ingestion boundaries.

## Setup

### Prerequisites

1. **k3s cluster** running and accessible via `kubectl`
2. **ArgoCD** installed on the cluster (manual bootstrap for now):

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Applying GitOps Configuration

Since there is no root Application yet (app-of-apps pattern is deferred), apply the manifests manually:

```bash
# Create namespaces first
kubectl apply -f gitops/namespaces/

# Then apply Application CRs
kubectl apply -f gitops/apps/ --recursive
```

Once applied, ArgoCD discovers the Application CRs from the cluster side and begins syncing. The CthuTool repo does **not** need to be registered as an ArgoCD source for this to work — Application CRs reference their source repos directly.

### Expected Initial State

- **CthuTool**: The `k8s/` directory exists (Deployment, Service, ConfigMap). The backend image is built by GitHub Actions and pushed to `ghcr.io/mickmetalholic/cthutool-backend:main` plus an immutable commit tag. After the image is pushed, the workflow writes the commit tag back to `k8s/deployment.yaml`; ArgoCD syncs that manifest change and rolls out the Deployment once the image is available to the cluster.
- **PixelPlayground**: The `k8s/` directory does not exist yet. The Application will show **Missing** in ArgoCD — this is expected. Once manifests are added to `https://github.com/mickmetalholic/PixelPlayground/tree/main/k8s/`, the configured `retry` block ensures ArgoCD recovers automatically within ~30 seconds.

### Adding a New App

1. Create the namespace: `gitops/namespaces/<app-name>.yaml`
2. Create the Application CR: `gitops/apps/<app-name>/application.yaml`
3. Apply manually: `kubectl apply -f gitops/namespaces/<app-name>.yaml -f gitops/apps/<app-name>/`
4. Commit and push — future changes to the app repo are synced automatically by ArgoCD

## Deployed Apps

| App | Namespace | Source Repo |
|-----|-----------|-------------|
| CthuTool | `cthutool` | [mickmetalholic/CthuTool](https://github.com/mickmetalholic/CthuTool) (self-hosted) |
| PixelPlayground | `pixel-playground` | [mickmetalholic/PixelPlayground](https://github.com/mickmetalholic/PixelPlayground) |
| Observability | `observability` | Upstream Helm charts managed by Applications in this repo |
