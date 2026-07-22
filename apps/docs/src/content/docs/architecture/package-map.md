---
title: Package Map
description: Repository package layout and ownership map.
---

| Path | Ownership |
| --- | --- |
| `apps/backend` | backend service APIs and orchestration |
| `apps/web` | browser-hosted web shell |
| `apps/agent` | UI-free local Agent process |
| `apps/agent-tray` | native tray and Agent process owner |
| `apps/cli` | `chc` command-line tool |
| `apps/docs` | Astro Starlight documentation site |
| `packages/agent-data-migration` | non-destructive legacy Desktop data migration |
| `packages/agent-protocol` | shared agent protocol package |
| `packages/browser-client` | TypeScript SDK for backend public browser sessions |
| `packages/config` | shared configuration package |
| `packages/obsidian-enhancer` | Obsidian plugin package |
| `codex/plugins/cthu-codex` | repository-managed Codex plugin |
| `gitops` | cluster GitOps namespaces, ArgoCD Application CRs, and observability stack manifests |
| `k8s` | CthuTool backend Kubernetes resources reconciled by ArgoCD |
| `openspec/specs` | authoritative capability requirements |

Use package README files for local package development commands. Use this docs site for user, operator, and architecture reading paths.
