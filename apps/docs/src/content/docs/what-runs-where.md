---
title: What Runs Where
description: Runtime placement for homelab services, observability, browser integrations, client tools, and shared state.
---

CthuTool splits Kubernetes-managed services from local client capabilities and trusted external integrations.

| Place | Components | Responsibility |
| --- | --- | --- |
| Homelab Kubernetes cluster | `cthutool` namespace, backend Deployment, backend Service, ConfigMap | Service APIs, public browser API, agent registry, browser orchestration, metrics, readiness, public status |
| Observability namespace | Prometheus, Grafana, Loki, Alloy, Tempo, OpenTelemetry Collector | Metrics, dashboards, logs, traces, and alerting foundation |
| ArgoCD namespace | `cthutool` and observability Application CRs | Reconcile `k8s/`, GitOps app resources, and upstream observability charts |
| Client computer | CthuDesktop, `chc` CLI | Local user workflows, desktop browser profiles, CLI commands |
| Trusted third-party app | `@cthutool/browser-client` | Typed calls to the backend public browser session API |
| Repository checkout | Apps, packages, OpenSpec, docs, GitOps manifests | Development source, requirements, package docs, and deployment desired state |
| External local apps | Google Chrome, Anki, Obsidian | Capabilities used by modules when installed by the user |

## Core Boundary

The backend can coordinate browser work, but raw browser login state stays on the desktop machine. CthuDesktop owns persistent browser profile directories, headed login windows, verification, Playwright contexts, and page state.

The browser client SDK does not connect to Playwright or desktop agents directly. It talks to the backend public browser API, which routes bounded action lists to one online CthuDesktop browser agent.

The CLI is installable on client computers and exposes supported commands such as Codex config workflows, bundled scripts, shell completion, and update commands. Browser runtime ownership remains with CthuDesktop rather than the CLI.

The repository checkout is not the user-facing homelab runtime. Local `pnpm` commands are for development and debugging. The homelab backend runtime is the Kubernetes Deployment reconciled by ArgoCD.

## Source References

- Deployment setup: [Homelab Setup](/deployment/homelab-setup/).
- GitOps operations: [GitOps Rollouts](/operations/gitops-rollouts/).
- Observability operations: [Observability](/operations/observability/).
- Browser client SDK: [Browser Client SDK](/modules/browser-client-sdk/).
- Desktop and browser profile details: [Browser Auth](/modules/browser-auth/) and [Desktop Runtime](/architecture/desktop-runtime/).
- CLI install path: [CLI Tool](/client/cli/).
