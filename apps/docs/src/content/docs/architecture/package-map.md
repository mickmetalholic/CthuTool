---
title: Package Map
description: Repository package layout and ownership map.
---

| Path | Ownership |
| --- | --- |
| `apps/backend` | backend service APIs and orchestration |
| `apps/web` | browser-hosted web shell |
| `apps/desktop` | Electron desktop client |
| `apps/cli` | `chc` command-line tool |
| `apps/docs` | Astro Starlight documentation site |
| `packages/app-shell` | shared app shell pieces |
| `packages/agent-protocol` | shared agent protocol package |
| `packages/browser-client` | TypeScript SDK for backend public browser sessions |
| `packages/config` | shared configuration package |
| `packages/ui` | shared UI components |
| `packages/obsidian-enhancer` | Obsidian plugin package |
| `codex/plugins/cthu-codex` | repository-managed Codex plugin |
| `gitops` | cluster GitOps namespaces, ArgoCD Application CRs, and observability stack manifests |
| `k8s` | CthuTool backend Kubernetes resources reconciled by ArgoCD |
| `openspec/specs` | authoritative capability requirements |

Use package README files for local package development commands. Use this docs site for user, operator, and architecture reading paths.
