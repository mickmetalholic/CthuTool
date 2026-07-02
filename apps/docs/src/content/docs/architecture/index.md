---
title: System Overview
description: High-level implementation architecture for CthuTool.
---

CthuTool is organized around a Kubernetes-managed homelab service core, local client runtimes, and optional trusted integrations.

```text
Client Computers
  CthuDesktop
  chc CLI
  Host Chrome / Anki / Obsidian

Trusted Third-party Apps
  @cthutool/browser-client

        |
        | HTTP / WebSocket / controlled browser sessions
        v

Homelab Kubernetes Cluster
  cthutool namespace
  Backend Deployment and Service
  Public browser APIs
  Metrics, readiness, and client-event ingestion

        |
        | /metrics, stdout/stderr, OTLP traces
        v

Observability Namespace
  Prometheus / Grafana
  Loki / Alloy
  Tempo / OpenTelemetry Collector

        ^
        |
        | GitHub Actions -> GHCR -> ArgoCD/Image Updater
        |

Repository Internals
  apps/*
  packages/*
  gitops/*
  k8s/*
  openspec/specs/*
```

## Main Boundaries

- Backend owns service APIs, public browser sessions, agent registry, browser task orchestration, metrics, readiness, and public status.
- Kubernetes and ArgoCD own homelab backend deployment state.
- GitOps observability resources own Prometheus, Grafana, Loki, Alloy, Tempo, and OpenTelemetry Collector deployment state.
- Desktop owns local browser runtime, login windows, profiles, and browser-capable agent execution.
- `@cthutool/browser-client` owns a typed third-party client surface for backend public browser sessions; it does not own Playwright runtime state.
- CLI owns local command-line workflows and installable utility behavior.
- OpenSpec owns normative capability requirements.

Use focused architecture, module, operations, and reference pages for implementation details and source links.
