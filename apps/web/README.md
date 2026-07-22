# CthuTool Web

`apps/web` is the independently deployed CthuTool management console.
This README is the package-local development reference. For user-facing module
and architecture docs, see `apps/docs/src/content/docs/modules/web-console.md`.

## Getting Started

Run the development server from the repository root:

```bash
pnpm --filter @cthutool/web dev
```

Local machine controls use the authenticated loopback Agent bridge. The Web
application is deployed independently and is never bundled into the Agent.

## Checks

```bash
pnpm --filter @cthutool/web typecheck
pnpm --filter @cthutool/web lint
pnpm --filter @cthutool/web build
```

## Boundaries

- Keep Next.js routing, metadata, and host bootstrap code in `apps/web`.
- Keep local capability behind the versioned Agent bridge client boundary.
- Keep Web deployment and Agent release lifecycles independent.
