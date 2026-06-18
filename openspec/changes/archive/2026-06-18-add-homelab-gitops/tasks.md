## 1. Directory scaffold

- [x] 1.1 Create `gitops/` at CthuTool repo root
- [x] 1.2 Create subdirectories: `gitops/namespaces/`, `gitops/apps/pixel-playground/`, `gitops/bootstrap/`
- [x] 1.3 Create `gitops/bootstrap/.gitkeep`
- [x] 1.4 Create `gitops/README.md` — structure overview, conventions, setup instructions

## 2. Namespace

- [x] 2.1 Create `gitops/namespaces/pixel-playground.yaml` — Namespace resource with name `pixel-playground` and `app.kubernetes.io/*` labels

## 3. ArgoCD Application CR

- [x] 3.1 Create `gitops/apps/pixel-playground/application.yaml` — Application CR with:
  - `source.repoURL: https://github.com/mickmetalholic/PixelPlayground`
  - `source.path: k8s/`
  - `source.targetRevision: main`
  - `destination.namespace: pixel-playground`
  - `syncPolicy.automated.prune: true`, `selfHeal: true`
  - `syncPolicy.retry` with exponential backoff (5 attempts, max 3m)

## 4. CthuTool backend manifests and image

- [x] 4.1 Create `apps/backend/Dockerfile` — multi-stage build (pnpm monorepo + NestJS)
- [x] 4.2 Create `k8s/deployment.yaml` — Deployment with GHCR image reference, health probes, and resource limits
- [x] 4.3 Create `k8s/service.yaml` — ClusterIP on port 3000
- [x] 4.4 Create `k8s/configmap.yaml` — non-sensitive environment variables
- [x] 4.5 Create `gitops/namespaces/cthutool.yaml` — Namespace resource with `app.kubernetes.io/*` labels
- [x] 4.6 Create `gitops/apps/cthutool/application.yaml` — Application CR pointing to CthuTool/k8s/ with auto-sync and retry
- [x] 4.7 Remove unused backend Playwright dependency and browser runtime environment variables
- [x] 4.8 Create `.github/workflows/backend-image.yml` — build and push `ghcr.io/mickmetalholic/cthutool-backend` on `main`
- [x] 4.9 Update backend image workflow to pin `k8s/deployment.yaml` to the built commit SHA after publishing

## 5. Verification

- [x] 5.1 Validate YAML syntax with Ruby `YAML.load_file` (no `kubectl` in this environment; equivalent to `--dry-run=client` syntax check)
