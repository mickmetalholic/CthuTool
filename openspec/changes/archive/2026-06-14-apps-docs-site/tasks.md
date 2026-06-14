## 1. Scaffold docs workspace

- [x] 1.1 Create `apps/docs` with package metadata named `@cthutool/docs`.
- [x] 1.2 Add Astro/Starlight dependencies scoped to the docs package.
- [x] 1.3 Add docs package scripts for local development and static production build.
- [x] 1.4 Configure Starlight site metadata, theme defaults, sidebar, and static output.

## 2. Establish content structure

- [x] 2.1 Add a docs-site landing page and repository overview.
- [x] 2.2 Add application sections for CLI, backend, desktop, web, and browser/auth documentation.
- [x] 2.3 Add a Codex plugin section that routes to CthuCodex documentation.
- [x] 2.4 Add a capability-specs section for current OpenSpec capabilities.
- [x] 2.5 Document source boundaries between docs-site pages, package READMEs, root `docs/`, and `openspec/specs/`.

## 3. Integrate workspace build

- [x] 3.1 Ensure `pnpm --filter @cthutool/docs build` produces static site output.
- [x] 3.2 Ensure Turborepo can include the docs package build through the existing root build flow.
- [x] 3.3 Update root and docs indexes to mention the docs site after it exists.

## 4. Validate

- [x] 4.1 Run the focused docs package build.
- [x] 4.2 Run relevant repository lint or format checks for changed docs and config.
- [x] 4.3 Run strict OpenSpec validation for `apps-docs-site`.
