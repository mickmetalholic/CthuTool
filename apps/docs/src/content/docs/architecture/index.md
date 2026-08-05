---
title: System Overview
description: High-level implementation architecture for CthuTool.
---

CthuTool is organized around an image-producing homelab service core, local client runtimes, and optional trusted integrations. The homelab cluster desired state is owned by the separate **CthuOps** repository.

```text
Client Computers
  the local CthuTool Agent
  chc CLI
  Host Chrome / Anki / Obsidian

Trusted Third-party Apps
  @cthutool/browser-client

        |
        | HTTP / WebSocket / controlled browser sessions
        v

Homelab Kubernetes Cluster (owned by CthuOps)
  cthutool namespace
  Backend Deployment and Service
  Public browser APIs
  Metrics, readiness, and client-event ingestion

        |
        | /metrics, stdout/stderr, optional OTLP traces
        v

External Observability Platform (external deployment platform; CthuOps may take over later)
  Prometheus / Grafana
  Log storage / collector
  Trace backend (when configured)

        ^
        |
        | GitHub Actions -> GHCR -> CthuOps digest pin -> ArgoCD
        |

Repository Internals
  apps/*
  packages/*
  gitops/README.md (pointer to CthuOps)
  openspec/specs/*
```

## Main Boundaries

- Backend owns service APIs, public browser sessions, agent registry, browser task orchestration, metrics, readiness, and public status.
- CthuOps owns Kubernetes, Argo CD, and image digest promotion for the homelab Backend. The cluster observability platform is an external deployment platform responsibility that CthuOps may take over later.
- CthuTool owns the Backend image build and GHCR publication; it does not own the live deployment version.
- Agent owns local browser runtime, login windows, profiles, and browser-capable agent execution.
- `@cthutool/browser-client` owns a typed third-party client surface for backend public browser sessions; it does not own Playwright runtime state.
- CLI owns local command-line workflows and installable utility behavior.
- OpenSpec owns normative capability requirements.

Use focused architecture, module, operations, and reference pages for implementation details and source links.
