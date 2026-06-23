---
title: What Runs Where
description: Runtime placement for homelab services, client tools, and shared state.
---

CthuTool splits Kubernetes-managed services from local client capabilities.

| Place | Components | Responsibility |
| --- | --- | --- |
| Homelab Kubernetes cluster | `cthutool` namespace, backend Deployment, backend Service, ConfigMap | Service APIs, agent registry, browser task orchestration, public status |
| ArgoCD namespace | `cthutool` Application CR | Reconcile `k8s/` manifests from git into the cluster |
| Client computer | CthuDesktop, `chc` CLI | Local user workflows, desktop browser profiles, CLI commands |
| Repository checkout | Apps, packages, OpenSpec, docs, GitOps manifests | Development source, requirements, and deployment desired state |
| External local apps | Google Chrome, Anki, Obsidian | Capabilities used by modules when installed by the user |

## Core Boundary

The backend can coordinate browser work, but raw browser login state stays on the desktop machine. CthuDesktop owns persistent browser profile directories, headed login windows, verification, and Playwright execution.

The CLI is installable on client computers and exposes supported commands such as Codex config workflows, bundled scripts, shell completion, and update commands. Browser runtime ownership remains with CthuDesktop rather than the CLI.

The repository checkout is not the user-facing homelab runtime. Local `pnpm` commands are for development and debugging. The homelab backend runtime is the Kubernetes Deployment reconciled by ArgoCD.

## Source References

- Deployment setup: [Homelab Setup](/deployment/homelab-setup/).
- GitOps operations: [GitOps Rollouts](/operations/gitops-rollouts/).
- Desktop and browser profile details: [Browser Auth](/modules/browser-auth/) and [Desktop Runtime](/architecture/desktop-runtime/).
- CLI install path: [CLI Tool](/client/cli/).
