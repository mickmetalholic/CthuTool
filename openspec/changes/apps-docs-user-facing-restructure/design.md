## Context

CthuTool is becoming a homelab-oriented system with server-side services deployed on a homelab machine and client tools installed on user computers. The current docs site is technically functional, but it mostly routes readers to repository files and OpenSpec areas. That structure is useful for contributors, but it does not answer the first user questions: what to deploy, what to install, what runs where, and how to operate the system.

The docs site should become the primary reading surface for users and operators. Repository README files, package README files, and OpenSpec specs should remain source documents with clearer boundaries.

## Goals / Non-Goals

**Goals:**

- Make the docs site user-facing, with deployment and installation paths before repository internals.
- Explain the homelab topology: backend/web services on the homelab machine, desktop and CLI on client computers, and shared browser/auth/runtime boundaries.
- Provide module-oriented usage pages for the major product areas.
- Add an architecture section that summarizes implementation logic while linking back to authoritative OpenSpec specs.
- Keep OpenSpec capability discovery synchronized with `openspec/specs/` or fail validation when it drifts.
- Preserve package README files as local development references.

**Non-Goals:**

- Change backend, desktop, web, CLI, or package runtime behavior.
- Replace OpenSpec as the requirements source of truth.
- Generate all user documentation from OpenSpec.
- Produce complete API reference generation unless a later change scopes it.

## Decisions

### User journeys define the primary navigation

The docs sidebar will be reorganized around reader intent:

- Start
- Homelab Deployment
- Client Installation
- Modules
- Operations
- Architecture
- Reference

This replaces the current repository-map-first navigation. Repository and source boundary pages can remain, but they move behind user and operator journeys. The alternative was to keep the existing `Applications` grouping and add more pages under it, but that continues to expose implementation folders before user tasks.

### Content moves into docs-site pages incrementally

Existing source material in `docs/browser-auth.md` and `docs/desktop-agent-console.md` will be split or summarized into docs-site pages where it serves user or architecture flows. The original files can remain during migration as source references or redirects, but the docs site should become the preferred entry point.

Package README files will stay focused on package-local development commands, checks, and ownership notes. User-facing deployment and install instructions should not be duplicated in each package README.

### Architecture pages summarize, specs remain authoritative

Architecture docs will explain the overall system and major boundaries in prose and diagrams:

- homelab deployment topology
- backend/web service boundary
- desktop runtime and browser host boundary
- CLI responsibilities
- browser auth/profile model
- agent protocol and command gateway concepts
- package map

When a page discusses requirements or capability behavior, it will link to the relevant OpenSpec spec instead of copying the normative requirement text. This avoids creating a second source of truth.

### OpenSpec index must be deterministic or validated

The current capability index is hand-maintained and can drift from `openspec/specs/`. This change should either generate the index from the filesystem or add a validation check that fails when the page omits current specs.

Generation is preferred if it can fit the existing Astro/Starlight Markdown flow without unusual build complexity. A validation script is acceptable as a first step if direct generation would add too much machinery.

## Risks / Trade-offs

- Docs become broader than current implementation maturity -> Mark incomplete modules clearly and prefer current behavior over aspirational copy.
- Moving content can break existing links -> Keep short compatibility pages or update root/documentation indexes to point to the new locations.
- OpenSpec index generation may complicate the docs build -> Start with a simple script that reads `openspec/specs/*/spec.md` and writes or validates a Markdown list.
- Architecture summaries can drift from specs -> Keep summaries high-level and link to exact spec directories for details.

## Migration Plan

1. Update docs-site navigation to the new user-facing sections.
2. Add skeletal landing pages for each section so navigation remains complete.
3. Move or summarize existing browser auth and desktop agent console content into the new pages.
4. Add architecture overview and topology pages with links to OpenSpec specs.
5. Add deterministic OpenSpec index generation or validation.
6. Update root and package README files to route users to the docs site and keep package README content local to development.
7. Run docs build/typecheck and the OpenSpec index check.

Rollback is straightforward: revert docs-site content, sidebar changes, and any validation script. No runtime migrations are involved.

## Open Questions

- Should the docs site publish generated OpenSpec index content at build time, or should the generated Markdown be committed?
- Which deployment target should be documented first: Docker Compose, bare Node/pnpm service, or both?
- Which desktop packaging/install format should be considered the primary user path for the first pass?
