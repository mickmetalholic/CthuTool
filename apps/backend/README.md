# Backend Sub-Application

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
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run dev
```

This command is for local development and debugging only. Homelab deployment is
owned by the separate `CthuOps` repository, which pins the published GHCR image
digest and reconciles the Backend Deployment through Argo CD. CthuTool itself no
longer contains Kubernetes or GitOps deployment manifests.

## Verify
- Health endpoint: `curl http://localhost:3000/health`
- Not found endpoint: `curl http://localhost:3000/unknown`
