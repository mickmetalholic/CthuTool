## Why

CthuTool documentation is spread across the root README, `docs/`, app and package READMEs, Codex plugin docs, and OpenSpec specs. A first-class docs site will make this material browsable, searchable, and easier to maintain as the monorepo grows.

## What Changes

- Add a first-class `apps/docs` workspace application for the CthuTool documentation site.
- Use a Markdown-first static documentation generator, with Astro Starlight as the preferred default unless implementation research finds a blocking repository constraint.
- Publish a curated navigation structure that starts from existing repository docs rather than blindly duplicating every source file.
- Include repository overview, application docs, Codex plugin docs, browser/auth docs, and OpenSpec capability sections.
- Add workspace scripts so the docs site can be developed, built, and validated through pnpm/Turborepo.
- Document the editorial boundary between authored docs-site pages, existing source docs, generated or mirrored pages, and OpenSpec requirement specs.

## Capabilities

### New Capabilities

- `apps-docs-site`: Defines the docs workspace app, documentation navigation, content sourcing boundaries, build integration, and validation behavior.

### Modified Capabilities

- None.

## Impact

- Affected code: new `apps/docs` package, root workspace metadata if needed, docs content index files, and docs-site configuration.
- Affected docs: root `README.md`, `docs/README.md`, app/package README references, Codex plugin docs, and OpenSpec specs surfaced by the docs site.
- Affected dependencies: likely Astro and Starlight packages added to the workspace lockfile.
- Affected CI/build: docs build should support focused validation and may participate in the root Turborepo build once stable.
