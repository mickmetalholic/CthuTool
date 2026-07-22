# Implementation notes

- Release profiles are parsed as atomic trust records; production entries require exact HTTPS/WSS boundaries and same-origin Web Agent URLs.
- Explicit custom development catalogs are marked `custom-development`, limited to loopback insecure endpoints, and impossible to enable under production configuration.
- Mutable Agent data is namespaced under `environments/<namespace>` with separate configuration, static secret, browser profile, log, and runtime paths.
- Public operator access uses a trusted reverse-proxy adapter that verifies the direct proxy peer and ignores forwarded identity headers. Public Agent WebSocket upgrades authenticate a separate environment static secret with constant-time comparison.
- Registry authority is keyed by `(environmentId, agentId)` and monotonically increasing connection generation. Gateway requests and responses carry that authority tuple and cannot fall back to another environment or generation.
- Runtime environment switching shuts down browser contexts, invalidates bridge tickets through a port, changes the profile root, and reconnects. A failed target remains selected and degraded rather than falling back.
