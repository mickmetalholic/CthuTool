---
title: Topology
description: Homelab services, deployed Web, local Agent, and browser runtime topology.
---

```text
Deployed Web --------------------> Backend operator APIs
      | fresh tray/CLI launch
      v
Loopback bridge -----------------> Local Agent -> host Chrome + local profiles
                                      |
                                      +---- authenticated WSS ----> Backend Agent Registry

Third-party App -> @cthutool/browser-client -> Backend Public Browser API
                                                   |
                                                   +-> bounded command -> Local Agent

GitHub Actions -> signed Agent release -> chc agent install -> native tray
GitHub Actions -> GHCR backend image -> ArgoCD -> Kubernetes Deployment
```

The homelab cluster runs backend services. Deployed Web assets are hosted
independently. The client host runs `chc`, the native tray, the UI-free Agent,
host Chrome, and environment-scoped browser profiles.

The Web page cannot choose backend or bridge trust dynamically. Its exact
origin, `/agent` URL, backend HTTPS endpoint, WSS Agent endpoint, and local
namespace come from the signed release catalog. The bridge is loopback-only and
requires a fresh one-time launch followed by a bearer session.

The backend stores orchestration and routing metadata, while actual Playwright
contexts, pages, and login state remain local to the Agent. Browser client SDK
callers never receive those local resources.
