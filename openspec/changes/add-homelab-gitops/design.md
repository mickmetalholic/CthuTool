## Context

CthuTool is a monorepo (pnpm + Turborepo) containing a NestJS backend, a Bun CLI tool, and an Obsidian plugin. It also serves as the homelab management hub — the centralized place for k3s cluster configuration.

This design covers the `gitops/` directory: what goes in it, how it's structured, and how ArgoCD uses it.

## Goals / Non-Goals

**Goals:**
- `gitops/` directory as the canonical home for cluster-level k8s resources
- Namespace for `pixel-playground` (first deployed third-party app)
- Namespace for `cthutool` (self-hosted backend)
- ArgoCD Application CRs pointing to each app's `k8s/` manifests
- `k8s/` directory for CthuTool backend with Deployment, Service, and ConfigMap
- `apps/backend/Dockerfile` — multi-stage container image build
- Bootstrap scaffold for future ArgoCD installation manifests
- Clear README documenting the directory structure and conventions

**Non-Goals:**
- Installing ArgoCD on the k3s cluster (manual bootstrap for now)
- ArgoCD ApplicationSet or app-of-apps pattern (single Application CR for now)
- ResourceQuota, LimitRange, NetworkPolicy (future additions)
- Secret management (API keys, database passwords, etc.) — apps like PixelPlayground will need secrets; the specific approach is deferred
- CI/CD pipeline for building and pushing the `cthutool/backend` container image

## Decisions

### Decision 1: `gitops/` at CthuTool repo root (not a separate repo)

CthuTool is already the "meta" project. Adding `gitops/` here avoids creating yet another repository while keeping a clear boundary between application code and cluster config.

### Decision 2: Directory structure

```
gitops/
├── namespaces/          ← Cluster-scoped: namespace resources
├── apps/                ← Per-app ArgoCD Application CRs
│   └── <app-name>/      ← One subdirectory per deployed app
│       └── application.yaml
├── bootstrap/           ← ArgoCD self-install manifests (future)
└── README.md
```

**Why `apps/<name>/` subdirectories**: When a second app (e.g., CthuTool's own backend) is deployed, a new `apps/cthutool/` subdirectory is added. Flat files would become unwieldy.

### Decision 3: ArgoCD Application CR — minimal spec

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: pixel-playground
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/mickmetalholic/PixelPlayground
    targetRevision: main
    path: k8s/
  destination:
    server: https://kubernetes.default.svc
    namespace: pixel-playground
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

Key properties:
- `source.path: k8s/` — ArgoCD reads all manifests recursively from this directory
- `syncPolicy.automated.selfHeal: true` — ArgoCD auto-corrects drift (manual `kubectl edit` reverts)
- `syncPolicy.automated.prune: true` — deleting a YAML from `k8s/` also deletes the resource from the cluster
- `syncPolicy.retry` — exponential backoff (5s → 10s → 20s → 40s → 80s, max 3m) handles transient failures. If PixelPlayground's `k8s/` is empty or missing (the initial state), ArgoCD retries and self-recovers once manifests are added — no manual re-sync needed.

### Decision 4: Bootstrap directory (placeholder only)

The `bootstrap/` directory is a `.gitkeep` placeholder. ArgoCD installation is out of scope — the user installs ArgoCD manually on the k3s cluster. Future iterations may add the installation manifests here so ArgoCD can self-manage.

### Decision 5: Split-repo GitOps model — CthuTool as app registry, not workload source

CthuTool's `gitops/` is the **app registry** — it records _which_ apps should run on the cluster and _where_ their manifests come from. Each app's actual workload manifests (Deployments, Services, ConfigMaps, etc.) live in that app's own repository.

```
CthuTool                       PixelPlayground
┌─────────────────┐             ┌──────────────────┐
│ gitops/apps/    │  references │ k8s/             │
│  pixel-playground│──┼────────▶│  deployment.yaml │
│   application.yaml│            │  service.yaml    │
│                 │             │  ingress.yaml    │
│ "app registry"  │             │ "workload source"│
└─────────────────┘             └──────────────────┘
```

This split keeps the registry small and avoids coupling CthuTool's CI pipeline to unrelated app manifest changes. Each app repo owns its own deployment details.

The Application CRs are applied to ArgoCD manually via `kubectl apply` — CthuTool itself is **not** an ArgoCD source at this stage. When the app-of-apps pattern is adopted (see Decision 6), the root Application will be the only CR applied manually; all child Applications will be synced by ArgoCD from git.

### Decision 6: App-of-apps migration path

**Current state (single Application CR):**

```
kubectl apply -f gitops/apps/pixel-playground/application.yaml   ← manual, each app
kubectl apply -f gitops/apps/cthutool/application.yaml           ← manual, each app
```

**Trigger**: When ≥ 3 apps are deployed, the overhead of manual `kubectl apply` per app justifies refactoring.

**Target state (app-of-apps):**

```
kubectl apply -f gitops/bootstrap/root-app.yaml   ← manual, one time only ◀═══ BOOTSTRAP BOUNDARY

# Everything below this line is managed by ArgoCD:
gitops/apps/                    ← root Application syncs this entire directory
├── pixel-playground/
│   └── application.yaml        ← ArgoCD-synced (child Application)
├── cthutool/
│   └── application.yaml        ← ArgoCD-synced (child Application)
└── .../
```

**Migration steps:**

1. Create `gitops/bootstrap/root-app.yaml` — an Application CR with `source.path: gitops/apps/` pointing to CthuTool as the source repo, and `directory.recurse: true` so ArgoCD discovers all child Applications.
2. Register CthuTool as a git source in ArgoCD (UI or `argocd repo add`).
3. `kubectl apply -f gitops/bootstrap/root-app.yaml` — bootstrap the root.
4. From this point, adding a new app means: create the child Application CR in `gitops/apps/<name>/`, commit, push — ArgoCD picks it up automatically. No more manual `kubectl apply`.

The root Application itself is subject to the same chicken-and-egg problem (who applies the root?). The answer is: a **one-time manual `kubectl apply`** during initial bootstrap. This is the standard ArgoCD bootstrapping pattern and is not expected to be automated until ArgoCD self-management is implemented.

### Decision 7: CthuTool backend self-hosting — k8s/ manifests + Dockerfile

The CthuTool backend is deployed from this same repository — its Application CR points back to `CthuTool/k8s/`. The container image is built locally from `apps/backend/Dockerfile`:

```bash
# Build on the k3s machine (or build elsewhere and push to a registry):
docker build -f apps/backend/Dockerfile -t cthutool/backend:latest .
```

The Deployment references `cthutool/backend:latest` with `imagePullPolicy: IfNotPresent` — suitable for a single-node homelab where images are built locally on the k3s host. For multi-node clusters, the image must be pushed to a registry and the Deployment updated with the registry path.

The Dockerfile uses a multi-stage build:
1. **Builder** — `pnpm install` in monorepo context, build workspace dependencies, `nest build`
2. **Production** — Node.js 24 Alpine + `playwright install --with-deps chromium` + built output

Key design choices:
- `emptyDir` for browser data — no persistent storage yet; browser state is ephemeral
- `BROWSER_HEADLESS: true` — no display needed in-cluster
- `replicas: 1` — single replica for homelab; the backend is not stateless enough for horizontal scaling (browser state, in-memory sessions)
- `resources.requests: 100m CPU / 256Mi` — conservative floor for scheduling
- `resources.limits: 500m CPU / 512Mi` — caps one Playwright instance's memory usage

## Known Gaps

- **PixelPlayground `k8s/` directory does not exist yet** (verified 2026-06-17). The Application will initially show **Missing** in ArgoCD — this is expected. The configured `retry` block ensures it self-recovers once manifests are added.
- **CthuTool backend requires a container image build before first deploy**. The `apps/backend/Dockerfile` blueprint exists, but the image must be built locally on the k3s host (`docker build -f apps/backend/Dockerfile -t cthutool/backend:latest .`). CI/CD for automated image builds is deferred.
- **Secret management is not addressed yet**. PixelPlayground (an automated content creation pipeline) will almost certainly need API keys, database credentials, or similar secrets. Possible approaches for a future change:
  - **External Secrets Operator (ESO)** — syncs from 1Password / Vault / AWS Secrets Manager into k8s Secrets
  - **Sealed Secrets** — encrypted Secrets committed to git, decrypted by a cluster-side controller
  - **SOPS + Age** — encrypted YAML files, decrypted at apply time
  The choice depends on whether a secret store is already running in the homelab and how many secrets need managing. Until this is resolved, apps that need secrets must have them created manually on the cluster (`kubectl create secret`).

## Future Work

- **CI path filtering**: Pushes to `gitops/` currently trigger the full monorepo CI pipeline (backend build, web build, tests) despite containing only static YAML. Add `paths-ignore: ['gitops/**']` to existing workflows, or add a lightweight YAML-lint-only workflow. Not done in this change to keep scope minimal.

## Risks / Trade-offs

- **[Risk] `selfHeal: true` reverts manual fixes**: If an operator `kubectl edit`-s a running resource in an emergency, ArgoCD reverts the change within 3 minutes. → **Acceptable**: the correct workflow is to edit the YAML in git, not the live cluster. Disable `selfHeal` if this pattern causes friction.
- **[Risk] `prune: true` with `targetRevision: main`**: A bad PR merged to `main` that deletes a critical manifest will also delete the resource from the cluster within minutes. → **Mitigation**: CI checks (lint, test, build) on PRs catch most issues before merge. Future: add a `syncWindow` to prevent sync during maintenance windows.
- **[Trade-off] Single Application CR, not app-of-apps**: A true app-of-apps pattern would have a root Application that points to a directory of child Applications. → Acceptable for now with one deployed app. When > 3 apps are deployed, refactor to app-of-apps.
