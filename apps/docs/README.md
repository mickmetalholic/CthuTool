# CthuTool Docs Site

Markdown-first documentation site for the CthuTool monorepo. This is the
primary user and operator documentation surface for homelab deployment, client
installation, module usage, operations, architecture, and reference material.

## Commands

```bash
pnpm --filter @cthutool/docs dev
pnpm --filter @cthutool/docs validate
pnpm --filter @cthutool/docs build
pnpm --filter @cthutool/docs typecheck
```

## Content Boundaries

Docs-site pages live under `apps/docs/src/content/docs/`. Package READMEs
remain package-local development references. Root `docs/` remains source notes
and shared assets. `openspec/specs/` remains the authoritative requirements
source.

The OpenSpec capability index is checked by
`pnpm --filter @cthutool/docs check:openspec-index`.
