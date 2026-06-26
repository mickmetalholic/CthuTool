---
title: Repository Map
description: Where CthuTool documentation lives and how to choose the right source.
---

The repository has several documentation layers:

| Area | Source |
| --- | --- |
| User deployment, install, module usage, operations, architecture | `apps/docs/src/content/docs/` |
| Homelab deployment desired state | `gitops/` and `k8s/` |
| Browser client SDK development details | `packages/browser-client/README.md` |
| Observability stack desired state | `gitops/observability/` and `gitops/apps/observability-*` |
| Repository setup and workspace conventions | `README.md` |
| Cross-package legacy/source notes | `docs/` |
| Package-local development commands | nearest package `README.md` |
| Current requirements | `openspec/specs/` |
| Proposed or in-flight changes | `openspec/changes/` |
| Repository-managed Codex plugin notes | `codex/plugins/cthu-codex/README.md` |

Use this docs site for user and operator reading paths. Use the source files above when changing package behavior, requirements, or project-owned Codex assets.
