## Why

The current docs site mostly acts as a repository map, which makes it hard for a homelab user to understand how to deploy CthuTool, install client tools, and use each module. The docs need a user-first structure while preserving OpenSpec as the authoritative source for implementation requirements.

## What Changes

- Reorganize the docs site around user journeys: overview, homelab deployment, client installation, module usage, operations, architecture, and reference.
- Add first-class guidance for deploying backend/web services on a homelab machine.
- Add first-class guidance for installing and updating desktop and CLI clients on client computers.
- Convert application pages from source-file routing pages into module-oriented usage entry points.
- Add an architecture section that explains the system topology and links back to authoritative OpenSpec specs instead of duplicating normative requirements.
- Add or document a deterministic way to keep the OpenSpec capability index aligned with `openspec/specs/`.
- Make `apps/docs/src/content/docs/` the most complete user, operator, module, and architecture documentation source.
- Reduce root docs and package README files to entry points, package-local development commands, and source-boundary notes so long-form content is not duplicated.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-docs-site`: Update the documentation site requirements from a repository navigation layer to a user-facing homelab deployment, client installation, module usage, operations, architecture, and OpenSpec reference surface.

## Impact

- Affects docs content and navigation under `apps/docs/`.
- May move or split source material currently in `docs/browser-auth.md` and `docs/desktop-agent-console.md` into docs-site pages.
- May require updating `docs/README.md`, root `README.md`, and package README files to clarify source boundaries.
- May replace long-form source documents or package README sections with short pointers once the docs-site pages carry the complete user-facing content.
- May add a small validation or generation script for the OpenSpec capability index.
- No runtime service APIs or user data formats are expected to change.
