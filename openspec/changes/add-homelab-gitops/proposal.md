## Why

CthuTool is the homelab management hub. Currently it has no cluster-level GitOps configuration — no namespaces, no ArgoCD Application CRs, no bootstrap scaffolding. Without these, ArgoCD has nothing to sync and apps like PixelPlayground cannot be deployed.

This change creates the `gitops/` directory in CthuTool, establishing it as the **app registry** — the canonical record of _which_ apps should be running on the cluster. Each app's actual workload manifests (Deployments, Services, etc.) live in that app's own repository.

## What Changes

- Create `gitops/` directory — the cluster-level GitOps configuration root
- Add namespaces for `cthutool` and `pixel-playground`
- Add ArgoCD Application CRs pointing to each app's `k8s/` manifests for auto-sync
- Add `bootstrap/` scaffold — placeholder for future ArgoCD installation manifests
- Add `k8s/` directory for CthuTool backend with Deployment, Service, and ConfigMap
- Add `apps/backend/Dockerfile` — multi-stage container build for the backend
- Add `README.md` — directory structure overview and setup instructions

## Capabilities

### New Capabilities

- `cluster-namespaces`: Namespace resources for all deployed applications, starting with `pixel-playground`
- `argo-applications`: ArgoCD Application CRs that wire app repos to cluster namespaces for auto-sync
- `gitops-bootstrap`: Scaffold for ArgoCD installation and self-management manifests

## Impact

- **Code**: new directories and files
  - `gitops/namespaces/{cthutool,pixel-playground}.yaml`
  - `gitops/apps/{cthutool,pixel-playground}/application.yaml`
  - `gitops/bootstrap/.gitkeep`
  - `gitops/README.md`
  - `k8s/{deployment,service,configmap}.yaml`
  - `apps/backend/Dockerfile`
- **Dependencies**: ArgoCD must be installed on the k3s cluster (out of scope; manual bootstrap for now)
- **Breaking**: None — purely additive

## Architecture

CthuTool is the homelab management hub. It holds the **app registry** (`gitops/`) — ArgoCD Application CRs that declare _which_ apps run on the cluster and _where_ their manifests come from. Each app repository (e.g., PixelPlayground) owns its workload manifests.

```
CthuTool/                           ┌── CthuTool is the app registry ──┐
│                                   │  "what should run on the         │
├── apps/         ← app code        │   cluster, and from where?"      │
├── packages/     ← libraries       └──────────────────────────────────┘
│
├── gitops/                        ← 🆕 app registry
│   ├── README.md
│   ├── namespaces/
│   │   ├── cthutool.yaml
│   │   └── pixel-playground.yaml
│   ├── apps/
│   │   ├── cthutool/
│   │   │   └── application.yaml   ← "CthuTool Backend from our k8s/"
│   │   └── pixel-playground/
│   │       └── application.yaml   ← "PixelPlayground from its k8s/"
│   └── bootstrap/
│       └── .gitkeep
│
├── k8s/                            ← 🆕 CthuTool backend manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
│
├── apps/backend/
│   └── Dockerfile                  ← 🆕 container image build
```

**Data flow**: The Application CRs are applied to the cluster manually (`kubectl apply -f gitops/apps/`). Once ArgoCD sees the CR, it pulls each app's `k8s/` manifests from the source repo and syncs them to the cluster. For CthuTool itself, the source repo is this repo — the backend's manifests live in `k8s/` and the container image is built from `apps/backend/Dockerfile`. For PixelPlayground, the manifests live in its own repository.

## Service Topology

```
                    ┌──────────────────────┐
                    │   CthuTool/gitops/   │  ← app registry
                    │  apps/{cthutool,     │
                    │    pixel-playground}/ │
                    │    application.yaml   │
                    └──────────┬───────────┘
                               │ kubectl apply (manual, once)
                               ▼
    ┌──────────────────────────────────────────────────────┐
    │                    ArgoCD (k3s)                      │
    │                                                      │
    │   cthutool:  polls CthuTool/k8s/ every 3 min         │
    │   pixel-playground: polls PixelPlayground/k8s/       │
    └────────┬───────────────────────────┬─────────────────┘
             │                           │ git pull
             ▼                           ▼
    ┌──────────────────┐    ┌──────────────────────────────┐
    │  CthuTool/k8s/   │    │   PixelPlayground/k8s/       │
    │  deployment.yaml │    │   (future — does not         │
    │  service.yaml    │    │    exist yet)                │
    │  configmap.yaml  │    │                              │
    │  (this change)   │    └──────────────────────────────┘
    └──────────────────┘
             │
             │ docker build -f apps/backend/Dockerfile
             ▼
    ┌──────────────────────────┐
    │  cthutool/backend:latest │  ← built on k3s host
    └──────────────────────────┘
```

CthuTool backend is self-hosted — the container image is built from the same repo and runs on the same k3s cluster it manages. PixelPlayground is an external app with its manifests in a separate repo.
