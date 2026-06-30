## Why

The docs home page is currently a plain Markdown overview, which makes the user documentation feel less polished than the rest of the product surface. A modern landing-style documentation entry point helps readers quickly choose the right path for deployment, installation, module usage, architecture, operations, and reference material.

## What Changes

- Replace the plain docs home page body with a modern, product-documentation-oriented landing page.
- Add a first-viewport hero with primary calls to action for getting started and understanding runtime placement.
- Add a command preview that mirrors the shortest deployment and CLI verification path.
- Add card-based entry points for quick start, homelab deployment, client installation, module browsing, architecture, operations, and reference material.
- Keep normal Starlight documentation navigation and page behavior for non-home documentation pages.
- Preserve static docs-site generation and existing content routes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `apps-docs-site`: Strengthen the docs home page requirement so the home page presents a modern, responsive, journey-oriented entry experience instead of only a text overview.

## Impact

- Affected app: `apps/docs`
- Affected files: docs home Markdown content and docs custom CSS
- No API, runtime service, dependency, or package boundary changes
- Validation remains focused on docs content tests, OpenSpec index sync, Astro build, and Astro typecheck
