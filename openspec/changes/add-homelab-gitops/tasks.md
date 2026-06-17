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

## 4. Verification

- [x] 4.1 Validate YAML syntax with Ruby `YAML.load_file` (no `kubectl` in this environment; equivalent to `--dry-run=client` syntax check)
