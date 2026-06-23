# Web Sub-Application

This README is the package-local backend development reference. For user-facing
homelab deployment and operations documentation, see the docs site under
`apps/docs/src/content/docs/deployment/`.

## Prerequisites

- Node.js 24.x
- pnpm 9.15.4

## Install
Run at repository root:

```bash
pnpm install
```

## Start for Local Development

Use explicit runtime configuration:

```bash
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run start:dev
```

This command is for local development and debugging. Homelab deployment is
defined by the Kubernetes and GitOps manifests in `gitops/` and `k8s/`.

## Verify
- Health endpoint: `curl http://localhost:3000/health`
- Not found endpoint: `curl http://localhost:3000/unknown`
