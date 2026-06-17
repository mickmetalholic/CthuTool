## Why

CthuTool is the homelab management hub. Currently it has no cluster-level GitOps configuration — no namespaces, no ArgoCD Application CRs, no bootstrap scaffolding. Without these, ArgoCD has nothing to sync and apps like PixelPlayground cannot be deployed.

This change creates the `gitops/` directory in CthuTool, establishing it as the **app registry** — the canonical record of _which_ apps should be running on the cluster. Each app's actual workload manifests (Deployments, Services, etc.) live in that app's own repository.

## What Changes

- Create `gitops/` directory — the cluster-level GitOps configuration root
- Add namespace for `pixel-playground` (the first deployed app)
- Add ArgoCD Application CR pointing to PixelPlayground's `k8s/` manifests for auto-sync
- Add `bootstrap/` scaffold — placeholder for future ArgoCD installation manifests
- Add `README.md` — directory structure overview and setup instructions

## Capabilities

### New Capabilities

- `cluster-namespaces`: Namespace resources for all deployed applications, starting with `pixel-playground`
- `argo-applications`: ArgoCD Application CRs that wire app repos to cluster namespaces for auto-sync
- `gitops-bootstrap`: Scaffold for ArgoCD installation and self-management manifests

## Impact

- **Code**: `gitops/` directory (new)
  - `gitops/namespaces/pixel-playground.yaml`
  - `gitops/apps/pixel-playground/application.yaml`
  - `gitops/bootstrap/.gitkeep`
  - `gitops/README.md`
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
│   │   └── pixel-playground.yaml
│   ├── apps/
│   │   └── pixel-playground/
│   │       └── application.yaml   ← "PixelPlayground runs here,
│   │                                  synced from its own k8s/ dir"
│   └── bootstrap/
│       └── .gitkeep
│
└── k8s/                           ← (future) CthuTool backend manifests
```

**Data flow**: The Application CRs are applied to the cluster manually (`kubectl apply -f gitops/apps/`). Once ArgoCD sees the CR, it pulls the app's own `k8s/` manifests from the source repo and syncs them to the cluster. The CthuTool repo itself is **not** an ArgoCD source — it holds the registry; each app repo holds the workload manifests.

## Service Topology

```
                    ┌──────────────────────┐
                    │   CthuTool/gitops/   │  ← app registry (this change)
                    │  apps/pixel-playground│
                    │    /application.yaml  │
                    └──────────┬───────────┘
                               │ kubectl apply (manual, once)
                               ▼
    ┌──────────────────────────────────────────────┐
    │                 ArgoCD (k3s)                  │
    │                                              │
    │   polls PixelPlayground every 3 min           │
    │   syncs to namespace pixel-playground         │
    └──────────────────────┬───────────────────────┘
                           │ git pull
                           ▼
    ┌──────────────────────────────────────────┐
    │   PixelPlayground/k8s/                   │  ← workload manifests
    │   (Deployments, Services, etc.)          │     (future — does not
    │                                          │      exist yet)
    └──────────────────────────────────────────┘
```

N/A — this change is infrastructure-only. It creates the wiring that allows apps to be deployed. No services are deployed by this change itself.
