---
title: Source Boundaries
description: How the docs site relates to README files, root docs, and OpenSpec requirements.
---

The docs site is the primary user and operator reading surface. It should reduce discovery cost without creating a stale second copy of package development notes or OpenSpec requirements.

## Canonical Sources

- User-facing deployment, installation, module usage, operations, and architecture docs live in `apps/docs/src/content/docs/`.
- Official homelab deployment desired state lives in `gitops/` and `k8s/`, with user/operator explanation in this docs site.
- Observability platform desired state lives in `gitops/apps/observability-*` and `gitops/observability/`, with operator explanation in this docs site.
- Browser client SDK development details live in `packages/browser-client/README.md`; user integration guidance lives in this docs site.
- Repository setup and workspace conventions remain in `README.md`.
- Legacy cross-package runtime source notes remain in `docs/` until migrated or retired.
- Package-local development commands remain in package README files.
- Normative requirements remain in `openspec/specs/`.
- Active proposals and implementation tasks remain in `openspec/changes/`.

## Deployment vs Development

Homelab deployment docs should describe the Kubernetes/GitOps path: namespace resources, ArgoCD Application CRs, `k8s/` manifests, GHCR backend images, rollout checks, and cluster health checks.

Local commands such as `pnpm --filter @cthutool/backend run start:dev` are development or debugging commands. They may appear in package README files or clearly labeled development/reference pages, but they should not be presented as the official homelab deployment path.

## Docs-Site Pages

Pages under `apps/docs/src/content/docs/` can summarize, group, and route to source files. When a page summarizes an existing README or spec, it should name the source path or document the boundary clearly.

## OpenSpec

OpenSpec specs are requirements, not general prose documentation. This site can expose them as a browsable capability section, but archived requirements stay authoritative under `openspec/specs/<capability>/spec.md`.
