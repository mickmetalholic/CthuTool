# CthuTool Docs Site

Markdown-first documentation site for the CthuTool monorepo.

## Commands

```bash
pnpm --filter @cthutool/docs dev
pnpm --filter @cthutool/docs build
pnpm --filter @cthutool/docs typecheck
```

## Content Boundaries

Docs-site pages live under `apps/docs/src/content/docs/` and are curated entry
points. Package READMEs, root `docs/`, and `openspec/specs/` remain source
documents unless a future change adds a deterministic sync step.
