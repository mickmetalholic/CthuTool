---
title: Local Agent Runtime
description: Headless Agent, native tray, local bridge, and browser profile architecture.
---

The client runtime is split into a UI-free Agent process and a small native
tray. The tray owns Agent startup and shutdown, shows health and the active
environment, opens deployed Web settings, and exits both processes together.

```text
Native tray -> headless Agent -> WSS backend Agent endpoint
                 |
                 +-> host Chrome + Agent-owned browser profiles
                 |
Deployed Web <- one-time launch -> loopback bridge
```

The Agent binds local control and Web bridge endpoints to loopback only. Control
records contain per-process nonces and exact process identity. Web access starts
with a short-lived, single-use launch ticket, then negotiates a bearer session
for one catalog environment and exact HTTPS Web origin. CORS is an additional
browser boundary, not authentication.

Environment selection is release-catalog controlled. Mutable state lives below
an environment namespace, while runtime ownership locks and versioned Agent
installations remain separate. Switching environments invalidates bridge
sessions, stops environment-owned browser work, changes the profile root, and
reconnects the backend client.

The Agent uses host Chrome and never reuses the user's everyday Chrome profile.
If Chrome is unavailable, the process stays diagnosable but does not advertise
browser readiness.

Signed release bundles contain the native tray, pinned Node runtime, compiled
Agent, environment catalog, production dependencies, and notices. They contain
no deployed Web assets, embedded renderer, or mutable user data.
