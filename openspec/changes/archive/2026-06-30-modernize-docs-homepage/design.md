## Context

`apps/docs` is an Astro Starlight documentation site. The existing home page is a plain Markdown overview with links, while the rest of the site already has structured documentation routes for deployment, clients, modules, operations, architecture, and reference material.

The change is limited to the docs home page presentation and global docs CSS. It does not add a new rendering framework, dependency, runtime service, or route model.

## Goals / Non-Goals

**Goals:**

- Make the docs home page feel like a modern product documentation entry point.
- Keep the home page focused on user and operator journeys rather than repository structure.
- Preserve the existing Starlight content system, search, static build, and route set.
- Keep non-home documentation pages in the normal Starlight reading layout.
- Ensure the home page remains responsive without horizontal overflow on desktop and mobile viewports.

**Non-Goals:**

- Redesign every documentation page.
- Replace Starlight, change navigation data, or add frontend dependencies.
- Change docs content ownership, OpenSpec authority, or generated adapter instructions.
- Introduce new product capabilities outside documentation presentation.

## Decisions

- Implement the home page as enhanced Markdown HTML plus custom CSS.
  - Rationale: Starlight already supports Markdown content and custom CSS, so the change stays inside the docs app without new dependencies.
  - Alternative considered: create a custom Astro page/layout. That would give more control, but it would be a larger divergence from the current content model for a single-page visual update.

- Use home-page-scoped CSS selectors for layout differences.
  - Rationale: the home page benefits from a wider landing-page layout, while regular docs pages still need sidebar navigation and table-of-contents behavior.
  - Alternative considered: globally widen or restyle Starlight pages. That would risk degrading long-form reading pages and unrelated documentation sections.

- Keep the hero content tied to existing documented workflows.
  - Rationale: the command preview and links should help users move into real setup, deployment, and reference pages without claiming unsupported behavior.
  - Alternative considered: use marketing-style claims or broad product copy. That would make the docs less precise and less useful for operators.

## Risks / Trade-offs

- `:has()` selector support is required for home-page-scoped Starlight layout overrides. → Limit its use to progressive layout overrides; the page content still renders if the selector is unsupported.
- Custom HTML in Markdown can become harder to maintain than simple Markdown. → Keep class names scoped with a `cthu-` prefix and keep the structure limited to reusable page sections.
- The command preview may drift from Quick Start content. → Keep preview commands aligned with `/quick-start/` and validate the docs site after edits.
