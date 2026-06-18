# Web Sub-Application

This README is the package-local backend development reference. For user-facing
homelab deployment and operations documentation, see the docs site under
`apps/docs/src/content/docs/deployment/`.

## Prerequisites
- Node.js >= 20
- pnpm >= 9

## Install
Run at repository root:

```bash
pnpm install
```

## Start
Use explicit runtime configuration:

```bash
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run start:dev
```

## Verify
- Health endpoint: `curl http://localhost:3000/health`
- Not found endpoint: `curl http://localhost:3000/unknown`
