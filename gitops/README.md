# gitops/

CthuTool no longer owns cluster desired state. Kubernetes manifests, Argo CD
Applications, namespaces, image digest promotion, and TLS are managed by the
separate **CthuOps** repository. Cluster-wide observability is intentionally
outside CthuTool and is currently an external deployment platform
responsibility; CthuOps may take it over later.

## Deployment Entry Point

Operators who need the homelab deployment entry point should use CthuOps:

```text
https://github.com/mickmetalholic/CthuOps
```

Key CthuOps locations:

- `apps/cthutool/` — CthuTool Backend `Deployment`, `Service`, `Ingress`, and
  the Kustomize root that pins the GHCR image by digest.
- `argocd/applications/cthutool.yaml` — Argo CD Application that reconciles the
  Backend into the `cthutool` namespace.
- `docs/cthutool-release.md` — image promotion workflow: CthuTool builds and
  publishes the image, then CthuOps pins the verified digest via pull request.

CthuTool remains the image-producing source repository: it builds
`apps/backend/Dockerfile` and publishes
`ghcr.io/mickmetalholic/cthutool-backend` `main` and commit-SHA tags from
`.github/workflows/backend.yml`. It does not own the live deployment version.

## Migration Note: PixelPlayground

The previous CthuTool `gitops/` tree also listed a `pixel-playground` Argo CD
Application pointing at `https://github.com/mickmetalholic/PixelPlayground`
(path `k8s/`, namespace `pixel-playground`).

As of this cleanup, that Application has **not** been migrated to CthuOps
(CthuOps currently owns only `cthutool` and `emby`). If PixelPlayground is still
deployed, migrate its Application to CthuOps or another owning operations
repository before relying on this cleanup for its deployment. Removing the old
tree does not itself migrate that workload.
