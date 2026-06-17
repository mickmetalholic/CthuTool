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

## 4. CthuTool backend manifests

- [x] 4.1 Create `apps/backend/Dockerfile` — multi-stage build (pnpm monorepo + NestJS + Playwright Chromium)
- [x] 4.2 Create `k8s/deployment.yaml` — Deployment with health probes, resource limits, emptyDir for browser data
- [x] 4.3 Create `k8s/service.yaml` — ClusterIP on port 3000
- [x] 4.4 Create `k8s/configmap.yaml` — non-sensitive environment variables
- [x] 4.5 Create `gitops/namespaces/cthutool.yaml` — Namespace resource with `app.kubernetes.io/*` labels
- [x] 4.6 Create `gitops/apps/cthutool/application.yaml` — Application CR pointing to CthuTool/k8s/ with auto-sync and retry

## 5. Verification

- [x] 5.1 Validate YAML syntax with Ruby `YAML.load_file` (no `kubectl` in this environment; equivalent to `--dry-run=client` syntax check)
