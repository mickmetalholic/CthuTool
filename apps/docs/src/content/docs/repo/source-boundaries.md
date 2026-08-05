---
title: Source Boundaries
description: How the docs site relates to README files, root docs, and OpenSpec requirements.
---

The docs site is the primary user and operator reading surface. It should reduce discovery cost without creating a stale second copy of package development notes or OpenSpec requirements.

## Canonical Sources

- User-facing deployment, installation, module usage, operations, and architecture docs live in `apps/docs/src/content/docs/`.
- Official homelab deployment desired state lives in the separate [CthuOps](https://github.com/mickmetalholic/CthuOps) repository, with user/operator explanation in this docs site.
- Cluster observability platform desired state is an external deployment platform responsibility; CthuOps may take it over later. CthuTool retains only application-level diagnostics.
- Browser client SDK development details live in `packages/browser-client/README.md`; user integration guidance lives in this docs site.
- Repository setup and workspace conventions remain in `README.md`.
- Legacy cross-package runtime source notes remain in `docs/` until migrated or retired.
- Package-local development commands remain in package README files.
- Normative requirements remain in `openspec/specs/`.
- Active proposals and implementation tasks remain in `openspec/changes/`.

## Deployment vs Development

Homelab deployment is owned by the separate CthuOps repository, which keeps the Backend Deployment, Service, Ingress, Argo CD Application, and digest pinning. Cluster observability is an external deployment platform responsibility that CthuOps may take over later. This docs site explains the boundary and points operators at CthuOps paths.

Local commands such as `pnpm --filter @cthutool/backend run dev` are development or debugging commands. They may appear in package README files or clearly labeled development/reference pages, but they should not be presented as the official homelab deployment path.

## Docs-Site Pages

Pages under `apps/docs/src/content/docs/` can summarize, group, and route to source files. When a page summarizes an existing README or spec, it should name the source path or document the boundary clearly.

## OpenSpec

OpenSpec specs are requirements, not general prose documentation. This site can expose them as a browsable capability section, but archived requirements stay authoritative under `openspec/specs/<capability>/spec.md`.
