---
title: Source Boundaries
description: How the docs site relates to README files, root docs, and OpenSpec requirements.
---

The docs site is the primary user and operator reading surface. It should reduce discovery cost without creating a stale second copy of package development notes or OpenSpec requirements.

## Canonical Sources

- User-facing deployment, installation, module usage, operations, and architecture docs live in `apps/docs/src/content/docs/`.
- Repository setup and workspace conventions remain in `README.md`.
- Legacy cross-package runtime source notes remain in `docs/` until migrated or retired.
- Package-local development commands remain in package README files.
- Normative requirements remain in `openspec/specs/`.
- Active proposals and implementation tasks remain in `openspec/changes/`.

## Docs-Site Pages

Pages under `apps/docs/src/content/docs/` can summarize, group, and route to source files. When a page summarizes an existing README or spec, it should name the source path or document the boundary clearly.

## OpenSpec

OpenSpec specs are requirements, not general prose documentation. This site can expose them as a browsable capability section, but archived requirements stay authoritative under `openspec/specs/<capability>/spec.md`.
