# CthuTool Web

`apps/web` is the browser-hosted scaffold for the future CthuTool management console.
This README is the package-local development reference. For user-facing module
and architecture docs, see `apps/docs/src/content/docs/modules/web-console.md`.

## Getting Started

Run the development server from the repository root:

```bash
pnpm --filter @cthutool/web dev
```

The scaffold intentionally contains only placeholder-safe content. Real management console pages should arrive through later shared UI/runtime work so `apps/desktop` and `apps/web` can reuse product pages.

## Checks

```bash
pnpm --filter @cthutool/web typecheck
pnpm --filter @cthutool/web lint
pnpm --filter @cthutool/web build
```

## Boundaries

- Keep Next.js routing, metadata, and host bootstrap code in `apps/web`.
- Do not import Electron renderer internals or desktop-only styles from `apps/desktop`.
- Do not add real product workflows in this scaffold-only change.
