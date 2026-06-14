## Context

CthuTool now has several documentation sources: the repository README, `docs/`, app and package READMEs, Codex plugin README files, and OpenSpec capability specs. The recent docs index makes these sources easier to find from GitHub, but it is still a file-tree experience without search, sidebar navigation, or a clear path for larger product documentation.

The repository is a pnpm/Turborepo monorepo where first-class apps live under `apps/*`. Existing frontend work includes React/Electron desktop and an `apps/web` project shell, but the documentation site should be its own package so docs publishing does not inherit product-app runtime concerns.

## Goals / Non-Goals

**Goals:**

- Add `apps/docs` as the first-class documentation site package.
- Keep the docs site Markdown-first and friendly to existing repository docs.
- Prefer Astro Starlight for the initial implementation because it provides docs navigation, search, dark mode, and static output without turning the docs site into a product app.
- Define a curated information architecture for repository, apps, Codex plugin, browser/auth, and OpenSpec capability material.
- Integrate docs development and build commands into the workspace.
- Preserve OpenSpec as the requirement source of truth while making specs easier to browse.

**Non-Goals:**

- Do not replace OpenSpec or move normative requirements out of `openspec/specs/`.
- Do not build a marketing homepage, blog, auth system, backend service, or product console.
- Do not auto-generate every documentation page in the first implementation.
- Do not refactor package README content unless a minimal link or source-boundary update is required.

## Decisions

### Use `apps/docs` as a separate workspace app

`apps/docs` matches the existing monorepo convention and keeps documentation build scripts local to the docs package. It also avoids overloading `docs/`, which should remain source documentation and assets rather than a generated-site project.

Alternative considered: put the site directly under `docs/`. That makes paths shorter but blurs authored docs and site implementation files, especially once Starlight config, generated content, and static assets are introduced.

### Prefer Astro Starlight for the initial site

Starlight is a Markdown-first docs system that provides the expected documentation-site primitives with relatively low application weight. It is a better default for this repository than building a custom React/Next site because the first job is documentation discovery, not product UI.

Alternatives considered:

- Docusaurus: strong for public, versioned documentation and community sites, but heavier than needed for the first internal docs site.
- VitePress: lightweight and good for static docs, but it would introduce a Vue-centered docs stack that does not otherwise match the repo's React-oriented app work.
- Nextra: useful for Next.js documentation sites, but ties docs to a Next app model that is unnecessary for this change.

### Treat existing docs as curated sources, not blind mirrors

The first implementation should create docs-site pages that either author canonical docs-site content or clearly point to source files. Package READMEs and OpenSpec specs should remain authoritative where they already are. The site can include curated pages that summarize and route to those sources.

This reduces duplication and prevents the docs site from becoming a stale second copy of every README.

### Surface OpenSpec capability specs as a browsable section

OpenSpec specs remain under `openspec/specs/`, but the docs site should expose them through a capability-specs section. The first pass can use curated copied pages or an explicit import/generation step, as long as the source boundary is documented.

If generation is added, it should be deterministic and local to `apps/docs` scripts rather than an implicit side effect of normal docs authoring.

### Keep validation focused

The docs package should expose `dev`, `build`, and `typecheck` or equivalent validation scripts. Root build can include the docs site through Turborepo once the package exists, but docs-specific validation should also be runnable with `pnpm --filter @cthutool/docs build`.

## Risks / Trade-offs

- Dependency churn from adding Astro/Starlight -> Pin compatible versions through the workspace lockfile and keep docs dependencies local to `apps/docs`.
- Stale duplicated content -> Prefer curated route pages and clear source links over wholesale README copies.
- OpenSpec navigation drift -> Start with explicit curated sections; only add generation if it can be deterministic and tested.
- Build time growth -> Keep docs build static and avoid pulling product app code into docs rendering.
- Confusion with `apps/web` -> Name package `@cthutool/docs` and document that it is publishing/documentation infrastructure, not the CthuTool management console.

## Migration Plan

1. Scaffold `apps/docs` and add workspace package metadata.
2. Add Starlight configuration, landing page, sidebar, and static assets.
3. Create initial content pages from current repository docs boundaries.
4. Add package scripts and root/Turborepo integration.
5. Run docs build and repository lint checks.
6. Update root and docs indexes to point readers to the docs site once it exists.

Rollback is straightforward before publishing: remove `apps/docs`, revert dependency lockfile changes, and keep existing Markdown docs in place.

## Open Questions

- Should the first implementation include a deployment target, or only local/static build output?
- Should OpenSpec pages be hand-curated initially, or should `apps/docs` include a deterministic sync script from `openspec/specs/`?
- Should the docs site be English-only for now, or reserve structure for future Chinese notes?
