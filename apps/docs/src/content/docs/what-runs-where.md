---
title: What Runs Where
description: Runtime placement for CthuTool services, the external deployment platform, browser integrations, and client tools.
---

CthuTool splits an image-producing service core, the external CthuOps-managed homelab deployment, and local client capabilities from trusted external integrations.

| Place | Components | Responsibility |
| --- | --- | --- |
| CthuTool repository | `apps/backend`, `apps/web`, `packages`, `.github/workflows/backend.yml` | Backend image build and GHCR publication, source, requirements, package docs |
| Homelab Kubernetes cluster (owned by CthuOps) | `cthutool` namespace, backend Deployment, backend Service, Ingress | Service APIs, public browser API, agent registry, browser orchestration, metrics, readiness, public status |
| External observability platform (external deployment platform; CthuOps may take over later) | Metrics, dashboards, logs, traces, alerting | Cluster observability; consumes the backend `/metrics`, stdout/stderr, and optional OTLP traces |
| ArgoCD (owned by CthuOps) | `cthutool` Application CR | Reconcile `apps/cthutool` desired state |
| Client computer | Native tray, headless Agent, `chc` CLI, host Chrome | Local browser profiles and control, Agent lifecycle, CLI commands |
| Trusted third-party app | `@cthutool/browser-client` | Typed calls to the backend public browser session API |
| External local apps | Google Chrome, Anki, Obsidian | Capabilities used by modules when installed by the user |

## Core Boundary

The backend can coordinate browser work, but raw browser login state stays on
the client machine. The local Agent owns environment-scoped browser profile
directories, headed login windows, verification, Playwright contexts, and page
state.

The browser client SDK does not connect to Playwright or the local Agent
directly. It talks to the backend public browser API, which routes bounded
action lists to one online browser-capable Agent.

The CLI installs and controls the tray-owned Agent and also exposes Codex config
workflows, bundled scripts, shell completion, and independent CLI updates. The
Agent, not the CLI or deployed Web page, owns the browser runtime.

The repository checkout is not the user-facing homelab runtime. Local `pnpm` commands are for development and debugging. The homelab backend runtime is the Kubernetes Deployment owned and reconciled by CthuOps.

## Source References

- Deployment setup: [Homelab Setup](/deployment/homelab-setup/).
- GitOps operations: [GitOps Rollouts](/operations/gitops-rollouts/).
- Observability operations: [Observability](/operations/observability/).
- Browser client SDK: [Browser Client SDK](/modules/browser-client-sdk/).
- Agent and browser profile details: [Browser Auth](/modules/browser-auth/) and [Local Agent Runtime](/architecture/desktop-runtime/).
- CLI install path: [CLI Tool](/client/cli/).
