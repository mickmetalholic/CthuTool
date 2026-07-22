## Host-neutral boundary inventory

| Current module | Electron imports | Runtime dependencies | Target ownership |
| --- | --- | --- | --- |
| `apps/desktop/src/main/agent-client.ts` | None | Agent/browser protocols, WebSocket constructor, config reader, observability sink | `@cthutool/agent-runtime` |
| `apps/desktop/src/main/playwright-host.ts` | None | Playwright, browser protocol, profile store, browser-runtime config, observability sink | `@cthutool/agent-runtime` |
| `apps/desktop/src/main/browser-profile-store.ts` | None | Node filesystem/path and browser protocol | `@cthutool/agent-runtime` |
| `apps/desktop/src/main/observability.ts` | None | Agent/browser protocol types | `@cthutool/agent-runtime` |
| `apps/desktop/src/main/config.ts` | None | Node filesystem/identity plus desktop appearance/window fields | Desktop adapter remains; connection/browser subset moves to runtime config ports |
| `apps/desktop/src/main/index.ts` | Yes | Electron app/window/IPC lifecycle and concrete runtime construction | Electron compatibility adapter only |

## Selected package boundary

- `packages/agent-runtime` owns the shared connection, browser host, profile store, redaction, lifecycle factory, user-data resolution, instance locks, and local-control protocol.
- `apps/agent` is the windowless Node.js executable and supplies concrete WebSocket, signal, process, and filesystem adapters.
- `apps/desktop` imports the shared package, retains renderer/window configuration, and supplies Electron paths/version/lifecycle callbacks.
- Shared runtime modules must not import `electron`; this is enforced by source scans and package tests.
- The extraction keeps legacy Electron paths readable and does not move mutable data.
